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
import { TreeifiedOWSResource } from '../../OwsContext/types'
import {v4 as uuidv4} from 'uuid'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NavigationIcon from '@mui/icons-material/Navigation';
import Typography from '@mui/material/Typography';
import Modal, {type ModalOwnProps} from '@mui/material/Modal';
import AddResourceDialog from './AddResourceDialog'





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
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)


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
        {node.title}
        {/* <ContextMenu node={node} map={map}/> */}
      </>
    )
  }, [map])

  const renderTree = useCallback((rootNode?: TreeifiedOWSResource): ReactNode => {
    if (rootNode !== undefined) {
      return (
        < TreeItem
          key={rootNode.id ?? uuidv4()}
          nodeId={rootNode.id ?? rootNode.properties.folder ?? uuidv4()}
          label={rootNode.title}
        >
          {
            Array.isArray(rootNode.children)
              ? rootNode.children.map((node) => { return renderTree(node) })
              : <></>
          }
        </TreeItem >
      )
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
  }, [ handleToggle, expanded, renderTree])

  return (
    <>
      <Box sx={{ '& > :not(style)': { m: 1 } }}>
      <Tooltip title="Add Resource">
        <Fab color="primary" aria-label="add" size="small" onClick={handleOpen}>
          <AddIcon />
        </Fab>
      </Tooltip>
      <AddResourceDialog open={open} setOpen={setOpen}/>


      <Tooltip title="Edit OWS Context">
        <Fab color="secondary" aria-label="edit" size="small">
          <EditIcon />
        </Fab>
      </Tooltip>
      
    </Box>

      <Divider/>

      {treeViews}

    </>
    
  )
}

export default LayerTree
