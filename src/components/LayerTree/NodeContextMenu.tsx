
import { type ReactNode, type MouseEvent, useCallback, useState } from 'react'

import { type TreeNode, useMapViewerContext } from '../MapViewer/MapViewerContext'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useDrawerContext } from '../Drawer/DrawerContext'
import { SecurityCreate } from '../SecurityEditor/Forms'
import { collectChildren } from '../MapViewer/utils'
import { Tabs } from '../Tab/Tabs'
import { useTabListContext } from '../Tab/TabListContext'
import L from 'leaflet'
import { type Map } from 'leaflet'


interface NodeContextMenuProps {
    node: TreeNode
    map?: Map
  }
  
  const NodeContextMenu = ({ node, map }: NodeContextMenuProps): ReactNode => {
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