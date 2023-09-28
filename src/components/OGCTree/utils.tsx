import { type RaRecord } from 'react-admin'

export const getDescendants = (nodes: RaRecord[], currentNode: RaRecord): RaRecord[] => {
  return nodes?.filter(
    node =>
      node?.lft > currentNode?.lft &&
      node?.rght < currentNode?.rght
  )
}

export const getChildren = (nodes: RaRecord[], currentNode: RaRecord): RaRecord[] => {
  return getDescendants(nodes, currentNode).filter(
    node => node?.level === currentNode?.level as number + 1
  )
}
