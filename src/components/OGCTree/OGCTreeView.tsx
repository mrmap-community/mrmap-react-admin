import { type ReactNode, type SyntheticEvent, useCallback, useMemo, useState } from 'react'
import { Loading, type RaRecord, type SimpleShowLayoutProps } from 'react-admin'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { TreeView } from '@mui/x-tree-view'

import { type JsonApiQueryParams } from '../../jsonapi/types/jsonapi'
import ExtendedTreeItem from './ExtendedTreeItem'
import { getChildren, getDescendants } from './utils'
import { useWMSTreeContext } from './WMSTreeContext'

export interface OgcLayerTreeProps {
  flatLayers: RaRecord[]
  treeRefetch: () => void
}

const OgcLayerTree = ({ flatLayers, treeRefetch }: OgcLayerTreeProps): ReactNode => {
  const mapTreeData = useCallback((nodes: RaRecord[], currentNode: RaRecord): ReactNode => {
    const childCount: number = Math.floor((currentNode.rght - currentNode.lft) / 2)
    if (childCount === 0) {
      return <ExtendedTreeItem
        key={`node-${currentNode.id}`}
        node={currentNode}
        onUpdateSuccessed={treeRefetch}
      />
    } else {
      return <ExtendedTreeItem
        key={`node-${currentNode.id}`}
        node={currentNode}
        onUpdateSuccessed={treeRefetch}
      >
        {getChildren(nodes, currentNode).map(child => mapTreeData(nodes, child))}
      </ExtendedTreeItem>
    }
  }, [])

  const tree: ReactNode[] = useMemo(() => {
    if (flatLayers === undefined || flatLayers.length === 0) {
      return []
    }
    const rootNode = flatLayers[0]
    const children = getDescendants(flatLayers, rootNode)
    return [mapTreeData(children, rootNode)]
  }, [flatLayers])

  return (
    tree
  )
}

export interface OGCTreeViewProps extends SimpleShowLayoutProps {
  jsonApiParams?: JsonApiQueryParams
}

const OgcTreeView = ({
  jsonApiParams = { include: 'layers' },
  ...rest
}: OGCTreeViewProps): ReactNode => {
  const { flatTree, refetch, isLoading } = useWMSTreeContext()

  const [expanded, setExpanded] = useState<string[]>([])

  const handleToggle = (event: SyntheticEvent, nodeIds: string[]): void => {
    if ((event.target as HTMLElement).closest('.MuiSvgIcon-root') != null) {
      setExpanded(nodeIds)
    }
  }

  if (isLoading ?? false) {
    return <Loading loadingPrimary='loading layers' />
  }

  return (
    <TreeView
      // aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      onNodeToggle={handleToggle}
      expanded={expanded}
    >
      <OgcLayerTree flatLayers={flatTree} treeRefetch={() => { void refetch() }} />
    </TreeView>
  )
}

export default OgcTreeView
