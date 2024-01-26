import { type RaRecord } from 'react-admin'
import { type TreeNode } from './MapViewerContext'

export const collectChildren = (node: TreeNode): TreeNode[] => {
    const children = node.children
    for (const child of children) {
        children.push(...collectChildren(child))
    }
    return children
}

export const getDescendants = (nodes: RaRecord[], currentNode: RaRecord): RaRecord[] => {
    return nodes?.filter(
        node =>
            node?.mpttLft > currentNode?.mpttLft &&
            node?.mpttRgt < currentNode?.mpttRgt
    )
}

export const getChildren = (nodes: RaRecord[], currentNode: RaRecord): RaRecord[] => {
    return getDescendants(nodes, currentNode).filter(
        node => node?.mpttDepth === currentNode?.mpttDepth as number + 1
    )
}

export const isDescendantOf = (nodeA: RaRecord, nodeB: RaRecord): boolean => {
    return (nodeA.mpttLft > nodeB.mpttLft && nodeA.mpttRgt < nodeB.mpttRgt)
}

export const isAncestorOf = (nodeA: RaRecord, nodeB: RaRecord): boolean => {
    return isDescendantOf(nodeB, nodeA)
}
