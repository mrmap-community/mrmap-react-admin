import { type ReactNode, type SyntheticEvent, useCallback, useMemo, useState } from 'react'
import { Loading, type RaRecord, type SimpleShowLayoutProps, useGetOne, useRecordContext, useResourceDefinition } from 'react-admin'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { TreeView } from '@mui/x-tree-view'

import ExtendedTreeItem from './ExtendedTreeItem'
import { getChildren, getDescendants } from './utils'

export interface OgcLayerTreeProps {
  flatLayers: RaRecord[]
  treeRefetch: () => void
}

const OgcLayerTree = ({ flatLayers, treeRefetch }: OgcLayerTreeProps): ReactNode => {
  const mapTreeData = useCallback((nodes: RaRecord[], currentNode: RaRecord): ReactNode => {
    const childCount: number = Math.floor((currentNode.rght - currentNode.lft) / 2)
    if (childCount === 0) {
      return <ExtendedTreeItem
        node={currentNode}
        onUpdateSuccessed={treeRefetch}
      />
    } else {
      return <ExtendedTreeItem
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

const OgcTreeView = ({ ...rest }: SimpleShowLayoutProps): ReactNode => {
  const { name } = useResourceDefinition()
  const record = useRecordContext()
  const {
    data,
    isLoading,
    error,
    refetch

  } = useGetOne(
    name,
    {
      id: rest.record?.id ?? record?.id,
      meta: {
        jsonApiParams: { include: 'layers' }
      }
    }
  )

  const flatLayers: RaRecord[] = useMemo(() => data?.layers?.sort((a: RaRecord, b: RaRecord) => a.lft - b.lft) ?? []
    , [data])

  const [expanded, setExpanded] = useState<string[]>([])
  const handleToggle = (event: SyntheticEvent, nodeIds: string[]): void => {
    if (event.target.closest('.MuiSvgIcon-root')) {
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
      <OgcLayerTree flatLayers={flatLayers} treeRefetch={refetch} />
    </TreeView>
  )
}

export default OgcTreeView
