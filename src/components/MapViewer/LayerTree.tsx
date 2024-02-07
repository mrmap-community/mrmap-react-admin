import { type ReactNode, type MouseEvent, type SyntheticEvent, useCallback, useMemo, useState } from 'react'

import { TreeItem, type TreeItemProps, TreeView } from '@mui/x-tree-view'
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

interface ContextMenuProps {
  node: TreeNode
}

const ContextMenu = ({ node }: ContextMenuProps): ReactNode => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
  } | null>(null)
  const { setEditor } = useMapViewerContext()
  const { bottomDrawer, setBottomDrawer } = useDrawerContext()
  const { tabList, setTabList } = useTabListContext()

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

      </Menu>
    </IconButton >

  )
}

const AsyncTreeItem = ({ rest }: TreeItemProps): ReactNode => {
  return (
    < TreeItem
      {...rest}

    >

    </TreeItem >
  )
}

const LayerTree = (): ReactNode => {
  // const { flatTree, refetch, isLoading } = useWMSTreeContext()

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
  }, [setExpanded])

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
        <ContextMenu node={node} />
      </>
    )
  }, [])

  const renderTree = useCallback((nodes: TreeNode) => (

    < TreeItem
      key={nodes.id}
      nodeId={nodes.id as string}
      label={renderTreeItemLabel(nodes)}

    >
      {
        Array.isArray(nodes.children)
          ? nodes.children.map((node) => renderTree(node))
          : null
      }
    </TreeItem >
  ), [])

  const treeViews = useMemo(() => {
    return wmsTrees?.map(tree => {
      return (
        <TreeView
          key={tree.id}
          // collapseIcon={<ExpandMoreIcon />}

          // defaultExpandIcon={<ChevronRightIcon />}
          onNodeExpansionToggle={handleToggle}
          expandedNodes={expanded}
          multiSelect
        >
          {renderTree(tree.rootNode)}

        </TreeView>
      )
    })
  }, [wmsTrees, expanded])

  return treeViews
}

export default LayerTree
