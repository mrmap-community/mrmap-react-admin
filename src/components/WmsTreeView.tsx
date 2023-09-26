import { type ChangeEvent, MouseEventHandler, type ReactNode, type SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Loading, type RaRecord, RecordRepresentation, ShowBase, type SimpleShowLayoutProps, useGetOne, useRecordContext, useResourceDefinition, useUpdate } from 'react-admin'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import LayersIcon from '@mui/icons-material/Layers'
import { Chip, Fab } from '@mui/material'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { TreeItem, type TreeItemProps, TreeView } from '@mui/x-tree-view'

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

export interface ActivateButtonProps {
  record: RaRecord
  callback?: () => void
}

const ActivateButton = ({ record, callback = () => { } }: ActivateButtonProps): ReactNode => {
  const [update, { data, isLoading, error, isSuccess }] = useUpdate()
  const [isMouseOver, setIsMouseOver] = useState(false)

  useEffect(() => {
    if (isSuccess) {
      callback()
    }
  }, [data])

  useEffect(() => {
    console.log(isMouseOver)
  }, [isMouseOver])

  const getLabel = useCallback(() => {
    if (isMouseOver && record.isActive) {
      return <><HighlightOffIcon sx={{ mr: 1 }} /> deactivate</>
    } else if (isMouseOver && !record.isActive) {
      return <><CheckCircleOutlineIcon sx={{ mr: 1 }} /> activate</>
    } else if (!isMouseOver && record.isActive) {
      return <><CheckCircleOutlineIcon sx={{ mr: 1 }} /> active</>
    } else if (!isMouseOver && !record.isActive) {
      return <><HighlightOffIcon sx={{ mr: 1 }} /> inactive</>
    }
  }, [record, isMouseOver])

  return (
    <Fab
      key={`activate-button-of-${record.id}`}
      variant="extended"
      size="small"
      color={isMouseOver ? record.isActive ? 'warning' : 'success' : record.isActive ? 'success' : 'warning'}
      onClick={async () => await update('Layer', { id: record.id, data: { id: record.id, isActive: !record.isActive }, previousData: record })}
      onMouseOver={() => { setIsMouseOver(true) }}
      onMouseOut={() => { setIsMouseOver(false) }}
      disabled={isLoading}
    >
      {getLabel()}
    </Fab>
  )
}

export interface OgcLayerItemProps extends Partial<TreeItemProps> {
  layer: RaRecord
  onUpdateSuccessed?: () => void
}

const OgcLayerItem = ({
  layer,
  nodeId = `tree-node-${layer.id}`,
  onUpdateSuccessed = () => { },
  ...rest
}: OgcLayerItemProps): ReactNode => {
  const getRightLabelContent = useCallback((record: RaRecord): ReactNode => {
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
        <Box color="inherit" sx={{ mr: 1 }} >
          {childCount > 0 ? <Chip label={childCount} /> : null}
        </Box>
        <Box color="inherit" sx={{ mr: 1 }} >
          <ActivateButton record={record} callback={onUpdateSuccessed} />

        </Box>
      </Box>
    )
  }, [])

  const getLabel = useCallback((record: RaRecord): ReactNode => {
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
          {getRightLabelContent(record)}
        </Typography>
      </Box>
    )
  }, [])

  return (
    <TreeItem
      key={layer.id}
      nodeId={`tree-node-${layer.id}`}
      label={getLabel(layer)}
      {...rest}
    />

  )
}

export interface OgcLayerTreeProps {
  flatLayers: RaRecord[]
  treeRefetch: () => void
}

const OgcLayerTree = ({ flatLayers, treeRefetch }: OgcLayerTreeProps): ReactNode => {
  const mapTreeData = useCallback((nodes: RaRecord[], currentNode: RaRecord): ReactNode => {
    const childCount: number = Math.floor((currentNode.rght - currentNode.lft) / 2)
    if (childCount === 0) {
      return <OgcLayerItem
        layer={currentNode}
        onUpdateSuccessed={treeRefetch}
      />
    } else {
      return <OgcLayerItem
        layer={currentNode}
        onUpdateSuccessed={treeRefetch}
      >
        {getChildren(nodes, currentNode).map(child => mapTreeData(nodes, child))}
      </OgcLayerItem>
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
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      onNodeToggle={handleToggle}
      expanded={expanded}
    >
      <OgcLayerTree flatLayers={flatLayers} treeRefetch={refetch} />
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
