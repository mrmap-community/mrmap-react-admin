import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { type RaRecord, RecordRepresentation, useUpdate } from 'react-admin'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import LayersIcon from '@mui/icons-material/Layers'
import { Checkbox, Chip, Fab } from '@mui/material'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view'

import NodeContextMenu from './NodeContextMenu'
import { getDescendants, isDescendantOf } from './utils'
import { type ActivateButtonProps } from './WmsTreeView'
import { useWMSTreeContext } from './WMSTreeContext'

// eslint-disable-next-line
const ActivateButton = ({ record, callback = () => { } }: ActivateButtonProps): ReactNode => {
  const [update, { data, isLoading, isSuccess }] = useUpdate()
  const [isMouseOver, setIsMouseOver] = useState(false)
  const isActive = Boolean(record.isActive)
  useEffect(() => {
    if (isSuccess) {
      callback()
    }
  }, [data])

  const getLabel = useCallback(() => {
    if (isMouseOver && isActive) {
      return <><HighlightOffIcon sx={{ mr: 1 }} /> deactivate</>
    } else if (isMouseOver && !isActive) {
      return <><CheckCircleOutlineIcon sx={{ mr: 1 }} /> activate</>
    } else if (!isMouseOver && isActive) {
      return <><CheckCircleOutlineIcon sx={{ mr: 1 }} /> active</>
    } else if (!isMouseOver && !isActive) {
      return <><HighlightOffIcon sx={{ mr: 1 }} /> inactive</>
    }
  }, [record, isMouseOver])

  return (
    <Fab
      key={`activate-button-of-${record.id}`}
      variant="extended"
      size="small"
      color={isMouseOver ? isActive ? 'warning' : 'success' : isActive ? 'success' : 'warning'}
      onClick={() => { void update('Layer', { id: record.id, data: { id: record.id, isActive: !isActive }, previousData: record }) }}
      onMouseOver={() => { setIsMouseOver(true) }}
      onMouseOut={() => { setIsMouseOver(false) }}
      disabled={isLoading}
    >
      {getLabel()}
    </Fab>
  )
}

export interface SelectTreeNodeProps {
  record: RaRecord
}

const SelectTreeNode = ({ record }: SelectTreeNodeProps): ReactNode => {
  const { selectedNodes, setSelectedNodes, flatTree } = useWMSTreeContext()

  const handleNodeSelect = useCallback((event: ChangeEvent, checked: boolean) => {
    event.stopPropagation()
    const nodeIndex = selectedNodes.indexOf(record)
    if (checked && nodeIndex === -1) {
      const descendants = getDescendants(flatTree, record)
      const toBeSelected = [record, ...descendants]
      setSelectedNodes([...toBeSelected, ...selectedNodes.filter(node => !toBeSelected.includes(node))])
    } else if (!checked && nodeIndex !== -1) {
      const descendants = getDescendants(flatTree, record)

      setSelectedNodes([...selectedNodes.filter(node => node.id !== record.id).filter(node => descendants.find(descendant => descendant.id === node.id) == null)])
    }
  }, [record, selectedNodes])

  const isChecked = useMemo(() => {
    return Boolean(selectedNodes.find(node => node.id === record.id))
  }, [selectedNodes, record])

  const isIndeterminate = useMemo(() => {
    return Boolean(selectedNodes.find(node => isDescendantOf(node, record))) && !isChecked
  }, [selectedNodes, record, isChecked])

  return (
    <Checkbox
      key={`checkbox-node-${record.id}`}
      id={`checkbox-node-${record.id}`}
      checked={isChecked}
      indeterminate={isIndeterminate}
      tabIndex={-1}

      onChange={(event, checked) => { handleNodeSelect(event, checked) }}
    />
  )
}

export interface OgcLayerItemProps extends Partial<TreeItemProps> {
  node: RaRecord
  onUpdateSuccessed?: () => void
}

const ExtendedTreeItem = ({
  node,
  nodeId = `tree-node-${node.id}`,
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
          <NodeContextMenu node={record} />

        </Box>
      </Box>
    )
  }, [])

  const getLabel = useCallback((record: RaRecord): ReactNode => {
    const isActive = Boolean(record.isActive)
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0.5,
          pr: 0
        }}
      >
        <SelectTreeNode record={record} />
        <Box component={LayersIcon} color={isActive ? 'green' : 'red'} sx={{ mr: 1 }} />
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
      key={node.id}
      nodeId={`tree-node-${node.id}`}
      label={getLabel(node)}
      {...rest}
    />

  )
}

export default ExtendedTreeItem
