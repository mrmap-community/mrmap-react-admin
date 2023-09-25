import { type ReactNode, useEffect, useMemo } from 'react'
import { Loading, type RaRecord, RecordRepresentation, ShowBase, type SimpleShowLayoutProps, useInfiniteGetList, useRecordContext, useResourceDefinition } from 'react-admin'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LayersIcon from '@mui/icons-material/Layers'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { TreeItem, TreeView } from '@mui/x-tree-view'

const getDescendants = (nodes: RaRecord[], currentNode: RaRecord): RaRecord[] => {
  return nodes?.filter(
    node =>
      node?.lft > currentNode?.lft &&
      node?.rght < currentNode?.rght
  )
}

const getChildren = (nodes: RaRecord[], currentNode: RaRecord): RaRecord[] => {
  return getDescendants(nodes, currentNode).filter(
    node => node?.level === currentNode?.level as number + 1
  )
}

const getLabel = (record: RaRecord): ReactNode => {
  const childCount: number = Math.floor((record.rght - record.lft) / 2)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 0.5,
        pr: 0
      }}
    >
      <Box component={LayersIcon} color="inherit" sx={{ mr: 1 }} />
      <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
        <RecordRepresentation record={record} />

      </Typography>
      <Typography variant="caption" color="inherit">
        {childCount > 0 ? <Chip label={childCount} /> : null}
      </Typography>
    </Box>
  )
}

const mapTreeData = (nodes: RaRecord[], currentNode: RaRecord): ReactNode => {
  const childCount: number = Math.floor((currentNode.rght - currentNode.lft) / 2)
  if (childCount === 0) {
    return <TreeItem
      key={currentNode.id}
      nodeId={`tree-node-${currentNode.id}`}
      label={getLabel(currentNode)}

    >
    </TreeItem>
  } else {
    return <TreeItem
      key={currentNode.id}
      nodeId={`tree-node-${currentNode.id}`}
      label={getLabel(currentNode)}

    >
      {getChildren(nodes, currentNode).map(child => mapTreeData(nodes, child))}
    </TreeItem>
  }
}

const OgcTreeView = ({ ...rest }: SimpleShowLayoutProps): ReactNode => {
  const { name } = useResourceDefinition()
  const record = useRecordContext()
  const {
    data,
    total,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useInfiniteGetList(
    'Layer',
    {

      pagination: { page: 1, perPage: 100 },
      sort: { field: 'lft', order: 'ASC' },
      meta: {
        relatedResource: { resource: name, id: record?.id }
        // jsonApiParams: { 'fields[Layer]': 'stringRepresentation,title,lft,rght,level' }
      }
    }
  )

  const flatLayers: RaRecord[] = useMemo(() => data?.pages.map(page => page.data.map(layerArray => layerArray)).flat() ?? []
    , [data])

  const tree: ReactNode[] = useMemo(() => {
    if (flatLayers === undefined || flatLayers.length === 0) {
      return []
    }
    const rootNode = flatLayers[0]
    const children = getDescendants(flatLayers, rootNode)
    return [mapTreeData(children, rootNode)]
  }, [flatLayers])

  /** load all layers first */
  useEffect(() => {
    if ((hasNextPage ?? false)) {
      fetchNextPage()
    }
  }, [data])

  if (isLoading ?? false ?? hasNextPage ?? false) {
    return <Loading loadingPrimary='loading layers' />
  }

  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {tree}
    </TreeView>
  )
}

const WmsTreeView = (): ReactNode => {
  const { name } = useResourceDefinition()

  return (
    <ShowBase resource={name}>
      <OgcTreeView ><div></div></OgcTreeView>
    </ShowBase>
  )
}

export default WmsTreeView
