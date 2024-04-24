import { type ChangeEvent, type ReactNode, useCallback, useMemo, MouseEvent } from 'react'

import { Checkbox } from '@mui/material'

import { useMapViewerContext } from './MapViewerContext'
import { OWSResource, TreeifiedOWSResource } from '../../OwsContext/types'
import { isAncestorOf, isDescendantOf } from '../../OwsContext/utils'

export interface TreeNodeCheckboxProps {
  node: TreeifiedOWSResource
}

const TreeNodeCheckbox = ({ node }: TreeNodeCheckboxProps): ReactNode => {
  const { features, setFeatureActive } = useMapViewerContext()

  const handleChange = useCallback((event: ChangeEvent | MouseEvent, checked?: boolean) => {
    event.stopPropagation()
    setFeatureActive(node.properties.folder as string, checked ?? !node.properties.active)
  }, [node, setFeatureActive])

  const isIndeterminate = useMemo(() => {
    const hasActiveDescendants = features.filter(
      feature => feature.properties.active).find((
        activeFeature: OWSResource) => isAncestorOf(activeFeature, node))
    return Boolean(hasActiveDescendants && !node.properties.active)
  }, [features, node])

  return (
    <Checkbox
      key={`checkbox-node-${node.id}`}
      id={`checkbox-node-${node.id}`}
      checked={node.properties.active ?? false}
      indeterminate={isIndeterminate}
      tabIndex={-1}
      onChange={(event, checked) => { handleChange(event, checked) }}
      onClick={(event, ) => {handleChange(event)}}
    />
  )
}

export default TreeNodeCheckbox
