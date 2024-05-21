import { MouseEvent, useCallback, useMemo, type ChangeEvent, type ReactNode } from 'react'

import { Checkbox } from '@mui/material'

import { TreeifiedOWSResource } from '../../ows-lib/OwsContext/types'
import { checkIndeterminateActive, findNodeByFolder } from '../../ows-lib/OwsContext/utils'
import { useOwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase'

export interface TreeNodeCheckboxProps {
  node: TreeifiedOWSResource
}

const TreeNodeCheckbox = ({ 
  node 
}: TreeNodeCheckboxProps): ReactNode => {
  const { features, setFeatureActive } = useOwsContextBase()

  const feature = useMemo(()=>{
    return findNodeByFolder(features, node.properties.folder ?? '')
  },[node])

  const handleChange = useCallback((event: ChangeEvent | MouseEvent, checked?: boolean) => {
    event.stopPropagation()
    if (feature === undefined) return
    setFeatureActive(feature, checked ?? !node.properties.active)
  }, [node, setFeatureActive])


  const isIndeterminate = useMemo(() => {
    if (feature === undefined) return
    return checkIndeterminateActive(features, feature)
  }, [features, node])

  return (
    <Checkbox
      key={`checkbox-node-${node.properties.folder}`}
      id={`checkbox-node-${node.properties.folder}`}
      checked={node.properties.active ?? false}
      indeterminate={isIndeterminate}
      tabIndex={-1}
      onChange={handleChange}
      onClick={handleChange}
    />
  )
}

export default TreeNodeCheckbox
