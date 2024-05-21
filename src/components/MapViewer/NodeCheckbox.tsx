import { MouseEvent, useCallback, useMemo, type ChangeEvent, type ReactNode } from 'react'

import { Checkbox } from '@mui/material'

import { TreeifiedOWSResource } from '../../ows-lib/OwsContext/types'
import { getDescandants } from '../../ows-lib/OwsContext/utils'
import { useOwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase'

export interface TreeNodeCheckboxProps {
  node: TreeifiedOWSResource
}

const TreeNodeCheckbox = ({ node }: TreeNodeCheckboxProps): ReactNode => {
  const { features, setFeatureActive } = useOwsContextBase()

  const handleChange = useCallback((event: ChangeEvent | MouseEvent, checked?: boolean) => {
    event.stopPropagation()
    setFeatureActive(node.properties.folder as string, checked ?? !node.properties.active)
  }, [node, setFeatureActive])

  const isIndeterminate = useMemo(() => {
    const descgendants = getDescandants(features, node)

    return !node.properties.active && descgendants.length > 0 && descgendants.find(feature => feature.properties.active === true) !== undefined
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
