import { type ReactNode, type MouseEvent, type SyntheticEvent, useCallback, useMemo, useState, useEffect, useRef } from 'react'

import { TreeItem, SimpleTreeView } from '@mui/x-tree-view'
import { type TreeNode, useMapViewerContext } from '../MapViewer/MapViewerContext'
import TreeNodeCheckbox from './NodeCheckbox'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useDrawerContext } from '../Drawer/DrawerContext'
import { SecurityCreate } from '../SecurityEditor/Forms'
import { collectChildren } from './utils'
import { Tabs } from '../Tab/Tabs'
import { useTabListContext } from '../Tab/TabListContext'
import L from 'leaflet'
import { type Map } from 'leaflet'
import { TreeifiedOWSResource } from '../../OwsContext/types'
import {v4 as uuidv4} from 'uuid'
import Sortable from 'sortablejs'
import { TreeItemProps } from '@mui/lab'
import { findNodeByFolder, getParentFolder, isLeafNode } from '../../OwsContext/utils'
import { Position } from '../../OwsContext/enums'


export interface DragableTreeItemProps extends TreeItemProps{
  node: TreeifiedOWSResource
  sortable?: Sortable.Options
  imaginary?: boolean
}

export const DragableTreeItem = ({
  node,
  sortable,
  imaginary = false,
  ...props
}: DragableTreeItemProps): ReactNode => {
  const ref = useRef()
  const { features, moveFeature } = useMapViewerContext()

  const createSortable = useCallback(()=>{
    if (ref.current === null || ref.current === undefined) return

    Sortable.create(ref.current, {
      group: {name: 'general',},
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.25,
      
      onEnd: (event) => {
        const evt = {...event}

        // cancel the UI update so <framework> will take care of it
        event.item.remove();
        if (event.oldIndex !== undefined) {
          event.from.insertBefore(event.item, event.from.children[event.oldIndex]);
        }

        const targetFolder = evt.to.dataset.owscontextFolder
        if (targetFolder === undefined) return
        const target = findNodeByFolder(features, targetFolder)

        if (target === undefined) {
          // undefined signals new subtree move event
          // move the node as child to the fictive parent

          const parentFolder = getParentFolder(targetFolder)
          if (parentFolder === undefined) return
          const parent = findNodeByFolder(features, parentFolder)
          if (parent === undefined) return
          moveFeature(node, parent, Position.firstChild)          
        } else {
          const newIndex = evt.newIndex
          if (newIndex === 0) {
            moveFeature(node, target, Position.left)
          } else if (newIndex === 1) {
            moveFeature(node, target, Position.right)
          }
        }

      },
      ...sortable
    })

  }, [ref, moveFeature])

  useEffect(()=>{
    createSortable()
  },[])

  return (
    <TreeItem
      ref={ref}
      key={uuidv4()}
      // nodeId={imaginary ? `${node.properties.folder}/0`: node.properties.folder as string}
      nodeId={uuidv4()}
      {...props}
      data-owscontext-folder={imaginary ? `${node.properties.folder}/0`: node.properties.folder}
    >
      {/* imaginary child node to create new childs */}
      {!imaginary && isLeafNode(features, node) ? <DragableTreeItem node={node} imaginary={true}></DragableTreeItem>: null}
      {props.children}
    </TreeItem>
  )

}



interface ContextMenuProps {
  node: TreeNode
  map?: Map
}

const ContextMenu = ({ node, map }: ContextMenuProps): ReactNode => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
  } | null>(null)

  const { setEditor } = useMapViewerContext()
  const { bottomDrawer, setBottomDrawer } = useDrawerContext()
  const { tabList, setTabList } = useTabListContext()
  //const { removeWmsTree, moveTreeUp, moveTreeDown } = useMapViewerContext()

  const handleContextMenu = (event: MouseEvent): void => {
    event.stopPropagation()
    // event.preventDefault()
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6
          }
        :
        // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
        // Other native context menus might behave different.
        // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
        null
    )
  }

  const handleClose = (): void => {
    setContextMenu(null)
  }

  const handleSecuityEditorCall = (): void => {
    setEditor(true)
    // set bottom drawer content to security editor mask
    const defaultValues = { securedService: node.record.service, securedLayers: collectChildren(node, true) }
    const newTabList = tabList
    newTabList.tabs.push({ tab: { label: 'new rule' }, tabPanel: { children: <SecurityCreate defaultValues={defaultValues} /> } })

    setTabList({ ...tabList, activeTab: String(newTabList.tabs.length - 1) })

    setBottomDrawer({ ...bottomDrawer, isOpen: true, children: <Tabs /> })
  }

  const flyToLayer = useCallback((node: TreeNode) => {
    const lowerLeft = L.latLng(node?.record?.bboxLatLon?.coordinates[0][0][1], node?.record?.bboxLatLon?.coordinates[0][0][0])
    const upperRight = L.latLng(node?.record?.bboxLatLon?.coordinates[0][2][1], node?.record?.bboxLatLon?.coordinates[0][2][0])
    const bounds = L.latLngBounds(upperRight, lowerLeft)

    // TODO: check current crs bounds

    map?.panTo(bounds.getCenter())
  }, [map])

  return (
    <IconButton onContextMenu={handleContextMenu} onClick={handleContextMenu}>
      <MoreHorizIcon />
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleSecuityEditorCall}>Security Editor</MenuItem>
       {/*  //<MenuItem onClick={() => { removeWmsTree(node.record?.service?.id) }}>Remove</MenuItem>
        //<MenuItem onClick={() => { moveTreeUp(node.record?.service?.id) }}>Move up</MenuItem>
        //<MenuItem onClick={() => { moveTreeDown(node.record?.service?.id) }}>Move Down</MenuItem> */}
        <MenuItem onClick={() => { flyToLayer(node) }}>Center Layer</MenuItem>

      </Menu>
    </IconButton >

  )
}

export interface LayerTreeProps {
  map?: Map
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const darkStyle = {
  ...style,
}


const LayerTree = ({ map }: LayerTreeProps): ReactNode => {
  const { trees } = useMapViewerContext()
  const [expanded, setExpanded] = useState<string[]>([])

  const handleToggle = useCallback((event: SyntheticEvent, nodeId: string, isExpanded: boolean): void => {
    const newExpanded = expanded
    if (isExpanded) {
      if (!newExpanded.includes(nodeId)) {
        newExpanded.push(nodeId)
      }
    } else {
      const index = newExpanded.indexOf(nodeId)
      if (index > -1) {
        newExpanded.splice(index, 1)
      }
    }

    if ((event.target as HTMLElement).closest('.MuiSvgIcon-root') != null) {
      setExpanded(newExpanded)
    }
  }, [expanded])

  const renderTreeItemLabel = useCallback((node: TreeifiedOWSResource) => {
    /* const securityRuleButton = (
      <IconButton>
        {node.record.isSpatialSecured ? <Tooltip title="Spatial secured"><VpnLockIcon /></Tooltip> : node.record.isSecured ? <Tooltip title="Secured"><LockIcon /></Tooltip> : null}
      </IconButton>
    )
 */
    return (
      <>
        <TreeNodeCheckbox node={node} />
        {/* {securityRuleButton} */}
        {node.properties.title}
        {/* <ContextMenu node={node} map={map}/> */}
      </>
    )
  }, [map])

  const renderTree = useCallback((node?: TreeifiedOWSResource): ReactNode => {
    if (node !== undefined) {
      return (<DragableTreeItem
                node={node}                    
                key={uuidv4()}
                label={renderTreeItemLabel(node)}
              >
                {
                  Array.isArray(node.children)
                    ? node.children.map((node) => { return renderTree(node) })
                    : null
                }
              </DragableTreeItem >)


    }
    return <></>
  }, [renderTreeItemLabel])

  const treeViews = useMemo(() => {
    return trees?.map(tree => {
      return (
        <SimpleTreeView
          key={tree.id}
          onNodeExpansionToggle={handleToggle}
          expandedNodes={expanded}
          multiSelect
        >
          
          {renderTree(tree)}

        </SimpleTreeView>
      )
    })
  }, [ trees, handleToggle, expanded, renderTree])

  return (
    <>
      {treeViews}
    </>
  )
}

export default LayerTree
