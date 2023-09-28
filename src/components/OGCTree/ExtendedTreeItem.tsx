import { type ChangeEvent, type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { type RaRecord, RecordRepresentation, useUpdate } from 'react-admin'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import LayersIcon from '@mui/icons-material/Layers'
import { Checkbox, Chip, Fab } from '@mui/material'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view'

import { useTreeContext } from './TreeContext'
import { getDescendants } from './utils'
import { type ActivateButtonProps } from './WmsTreeView'

const ActivateButton = ({ record, callback = () => { } }: ActivateButtonProps): ReactNode => {
  const [update, { data, isLoading, error, isSuccess }] = useUpdate()
  const [isMouseOver, setIsMouseOver] = useState(false)

  useEffect(() => {
    if (isSuccess) {
      callback()
    }
  }, [data])

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

export interface SelectTreeNodeProps {
  record: RaRecord
}

const SelectTreeNode = ({ record }: SelectTreeNodeProps): ReactNode => {
  const { selectedNodes, setSelectedNodes, flatTree } = useTreeContext()

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

  useEffect(() => { console.log('selectedNodes changed', selectedNodes) }, [selectedNodes])

  const isChecked = useMemo(() => {
    return Boolean(selectedNodes.find(node => node.id === record.id))
  }, [selectedNodes, record])

  return (
    <Checkbox
      key={`checkbox-node-${record.id}`}
      id={`checkbox-node-${record.id}`}
      checked={isChecked}
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
        <SelectTreeNode record={record} />
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
      key={node.id}
      nodeId={`tree-node-${node.id}`}
      label={getLabel(node)}
      {...rest}
    />

  )
}

export default ExtendedTreeItem
