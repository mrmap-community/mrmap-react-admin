import { type ChangeEvent, type ReactNode, useCallback, useMemo } from 'react'

import { Checkbox } from '@mui/material'

import { useMapViewerContext } from './MapViewerContext'
import { TreeifiedOWSResource } from '../../OwsContext/types'

export interface TreeNodeCheckboxProps {
  node: TreeifiedOWSResource
}

const TreeNodeCheckbox = ({ node }: TreeNodeCheckboxProps): ReactNode => {
  const { activeFeatures, setFeatureActive } = useMapViewerContext()
  
  const handleChange = useCallback((event: ChangeEvent, checked: boolean) => {
    event.stopPropagation()
    setFeatureActive(node.id as string, checked)

  }, [])

  const isIndeterminate = useMemo(() => {
    //return Boolean(tree?.checkedNodes.find((checkedNode: TreeNode) => isDescendantOf(checkedNode.record, node.record))) && !node.properties.active
  }, [activeFeatures, node])

  return (
    <Checkbox
      key={`checkbox-node-${node.id}`}
      id={`checkbox-node-${node.id}`}
      checked={node.properties.active ?? false}
      indeterminate={node.properties.active ?? false}
      tabIndex={-1}
      onChange={(event, checked) => { handleChange(event, checked) }}
    />
  )
}

export default TreeNodeCheckbox
