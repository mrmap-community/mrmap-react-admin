import { type ReactNode, type MouseEvent, type SyntheticEvent, useCallback, useMemo, useState } from 'react'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { TreeItem, TreeView } from '@mui/x-tree-view'
import { type TreeNode, useMapViewerContext } from '../MapViewer/MapViewerContext'
import TreeNodeCheckbox from './NodeCheckbox'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { FeatureGroup, GeoJSON } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'

const SecurityEditor = (): ReactNode => {
  return (
    <FeatureGroup>
      <EditControl
        position='topright'
        // onEdited={updateGeoJson}
        // onCreated={updateGeoJson}
        // onDeleted={updateGeoJson}
        // onDrawStop={onEdit}
        draw={{
          marker: false,
          circlemarker: false,
          circle: false
        }}
      />
    </FeatureGroup>
  )
}

interface ContextMenuProps {
  node: TreeNode
}

const ContextMenu = ({ node }: ContextMenuProps): ReactNode => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
  } | null>(null)
  const { tiles, setTiles, setEditor } = useMapViewerContext()

  const handleContextMenu = (event: MouseEvent): void => {
    console.log(node)
    event.stopPropagation()
    // event.preventDefault()
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6
        }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
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
    // TODO: open bottom drawer
    // set bottom drawer content to security editor mask
    console.log('huhu')
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

const LayerTree = (): ReactNode => {
  // const { flatTree, refetch, isLoading } = useWMSTreeContext()

  const { wmsTrees } = useMapViewerContext()

  const [expanded, setExpanded] = useState<string[]>([])

  const handleToggle = useCallback((event: SyntheticEvent, nodeIds: string[]): void => {
    if ((event.target as HTMLElement).closest('.MuiSvgIcon-root') != null) {
      setExpanded(nodeIds)
    }
  }, [setExpanded])

  const renderTreeItemLabel = useCallback((node: TreeNode) => {
    return <><TreeNodeCheckbox node={node} /> {node.name} <ContextMenu node={node} /></>
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
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          onNodeToggle={handleToggle}
          expanded={expanded}

        >
          {renderTree(tree.rootNode)}

        </TreeView>
      )
    })
  }, [wmsTrees, expanded])

  return treeViews
}

export default LayerTree
