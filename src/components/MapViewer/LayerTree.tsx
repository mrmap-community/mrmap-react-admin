import { type ReactNode, type SyntheticEvent, useCallback, useMemo, useState } from 'react'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { TreeItem, TreeView } from '@mui/x-tree-view'
import { type TreeNode, useMapViewerContext } from '../MapViewer/MapViewerContext'
import TreeNodeCheckbox from './NodeCheckbox'

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
    return <><TreeNodeCheckbox node={node} /> {node.name}</>
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
