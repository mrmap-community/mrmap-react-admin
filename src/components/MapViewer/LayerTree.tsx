import { type ReactNode, type MouseEvent, type SyntheticEvent, useCallback, useMemo, useState } from 'react'

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
import VpnLockIcon from '@mui/icons-material/VpnLock'
import LockIcon from '@mui/icons-material/Lock'
import Tooltip from '@mui/material/Tooltip'
import { Tabs } from '../Tab/Tabs'
import { useTabListContext } from '../Tab/TabListContext'
import L from 'leaflet'
import { type Map } from 'leaflet'

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
  const { removeWmsTree, moveTreeUp, moveTreeDown } = useMapViewerContext()

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

    map?.flyToBounds(bounds)
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
        <MenuItem onClick={() => { removeWmsTree(node.record?.service?.id) }}>Remove</MenuItem>
        <MenuItem onClick={() => { moveTreeUp(node.record?.service?.id) }}>Move up</MenuItem>
        <MenuItem onClick={() => { moveTreeDown(node.record?.service?.id) }}>Move Down</MenuItem>
        <MenuItem onClick={() => { flyToLayer(node) }}>Center Layer</MenuItem>

      </Menu>
    </IconButton >

  )
}

export interface LayerTreeProps {
  map?: Map
}

const LayerTree = ({ map }: LayerTreeProps): ReactNode => {
  const { wmsTrees } = useMapViewerContext()

  const [expanded, setExpanded] = useState<string[]>([])

  const handleToggle = useCallback((event: SyntheticEvent, nodeId: string, isExpanded: boolean): void => {
    const newExpanded = expanded
    if (isExpanded) {
      if (!newExpanded.includes(nodeId)) {
        newExpanded.push(nodeId)
        // TODO: fetch children of node and append them
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

  const renderTreeItemLabel = useCallback((node: TreeNode) => {
    const securityRuleButton = (
      <IconButton>
        {node.record.isSpatialSecured ? <Tooltip title="Spatial secured"><VpnLockIcon /></Tooltip> : node.record.isSecured ? <Tooltip title="Secured"><LockIcon /></Tooltip> : null}
      </IconButton>
    )

    return (
      <>
        <TreeNodeCheckbox node={node} />
        {securityRuleButton}
        {node.name}
        <ContextMenu node={node} map={map}/>
      </>
    )
  }, [map])

  const renderTree = useCallback((node?: TreeNode): ReactNode => {
    if (node !== undefined) {
      return (
        < TreeItem
          key={node.id}
          nodeId={node.id as string}
          label={renderTreeItemLabel(node)}
        >
          {
            Array.isArray(node.children)
              ? node.children.map((node) => { return renderTree(node) })
              : <></>
          }
        </TreeItem >
      )
    }
    return <></>
  }, [renderTreeItemLabel])

  const treeViews = useMemo(() => {
    return wmsTrees?.map(tree => {
      return (
        <SimpleTreeView
          key={tree.id}
          onNodeExpansionToggle={handleToggle}
          expandedNodes={expanded}
          multiSelect
        >
          {renderTree(tree.rootNode)}

        </SimpleTreeView>
      )
    })
  }, [wmsTrees, handleToggle, expanded, renderTree])

  return treeViews
}

export default LayerTree
