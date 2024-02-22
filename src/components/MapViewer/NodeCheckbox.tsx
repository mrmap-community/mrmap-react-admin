import { type ChangeEvent, type ReactNode, useCallback, useMemo } from 'react'

import { Checkbox } from '@mui/material'

import { type TreeNode, useMapViewerContext } from './MapViewerContext'
import { collectChildren, isDescendantOf } from './utils'

export interface TreeNodeCheckboxProps {
  node: TreeNode
}

const TreeNodeCheckbox = ({ node }: TreeNodeCheckboxProps): ReactNode => {
  const { wmsTrees, updateOrAppendWmsTree } = useMapViewerContext()

  const tree = useMemo(() => {
    return wmsTrees.find(tree => tree.id === node.record.service.id)
  }, [wmsTrees])

  const handleChange = useCallback((event: ChangeEvent, checked: boolean) => {
    event.stopPropagation()

    if (tree !== undefined) {
      const newTree = { ...tree }

      const index = tree.checkedNodes?.findIndex(n => n.id === node.id)

      if (checked && index === -1) {
        const descendants = collectChildren(node)
        const toBeChecked = [node, ...descendants]
        newTree.checkedNodes = [...toBeChecked, ...newTree.checkedNodes.filter(node => !toBeChecked.includes(node))]
      } else if (!checked) {
        const descendants = collectChildren(node)
        newTree.checkedNodes = [...newTree.checkedNodes.filter(n => n.id !== node.id).filter(n => descendants.find(descendant => descendant.id === n.id) == null)]
      }

      updateOrAppendWmsTree(newTree)
    }
  }, [wmsTrees, tree])

  const isChecked = useMemo(() => {
    return Boolean(tree?.checkedNodes.find((checkedNode: TreeNode) => checkedNode.id === node.id))
  }, [tree, node])

  const isIndeterminate = useMemo(() => {
    return Boolean(tree?.checkedNodes.find((checkedNode: TreeNode) => isDescendantOf(checkedNode.record, node.record))) && !isChecked
  }, [tree, node])

  return (
    <Checkbox
      key={`checkbox-node-${node.id}`}
      id={`checkbox-node-${node.id}`}
      checked={isChecked}
      indeterminate={isIndeterminate}
      tabIndex={-1}
      onChange={(event, checked) => { handleChange(event, checked) }}
    />
  )
}

export default TreeNodeCheckbox
