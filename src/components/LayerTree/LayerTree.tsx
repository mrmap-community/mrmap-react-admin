import { type ReactNode, type SyntheticEvent, useCallback, useMemo, useState, useEffect } from 'react'

import { SimpleTreeView } from '@mui/x-tree-view'
import { useMapViewerContext } from '../MapViewer/MapViewerContext'
import TreeNodeCheckbox from '../MapViewer/NodeCheckbox'

import { type Map } from 'leaflet'
import { TreeifiedOWSResource } from '../../OwsContext/types'
import { DragableTreeItem } from './DragableTreeItem'



export interface LayerTreeProps {
  map?: Map
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const darkStyle = {
  ...style,
}


const LayerTree = ({ map }: LayerTreeProps): ReactNode => {
  const { trees } = useMapViewerContext()
  const [expanded, setExpanded] = useState<string[]>([])

  const handleToggle = useCallback((event: SyntheticEvent, nodeId: string, isExpanded: boolean): void => {

    const newExpanded = [...expanded]
    if (isExpanded) {
      if (!newExpanded.includes(nodeId)) {
        newExpanded.push(nodeId)
      }
    } else {
      const index = newExpanded.indexOf(nodeId)
      if (index > -1) {
        newExpanded.splice(index, 1)
      }
    }
    console.log('huhu')
    if ((event.target as HTMLElement).closest('.MuiSvgIcon-root') != null) {
      console.log('hoho')
      setExpanded(newExpanded)
    }
  }, [expanded])

  const renderTreeItemLabel = useCallback((node: TreeifiedOWSResource) => {
    /* const securityRuleButton = (
      <IconButton>
        {node.record.isSpatialSecured ? <Tooltip title="Spatial secured"><VpnLockIcon /></Tooltip> : node.record.isSecured ? <Tooltip title="Secured"><LockIcon /></Tooltip> : null}
      </IconButton>
    )
 */
    return (
      <>
        <TreeNodeCheckbox node={node} />
        {/* {securityRuleButton} */}
        {node.properties.title}
        {/* <ContextMenu node={node} map={map}/> */}
      </>
    )
  }, [map])

  const renderTree = useCallback((node?: TreeifiedOWSResource): ReactNode => {
    if (node !== undefined) {
      return (<DragableTreeItem
                node={node}                    
                key={node.properties.folder}
                label={renderTreeItemLabel(node)}
              >
                {
                  Array.isArray(node.children)
                    ? node.children.map((node) => { return renderTree(node) })
                    : null
                }
              </DragableTreeItem >)


    }
    return <></>
  }, [renderTreeItemLabel])

  useEffect(()=>{
    console.log('updated expanded', expanded)
  },[expanded])

  const treeViews = useMemo(() => {
    return trees?.map(tree => {
      return (
        <SimpleTreeView
          key={tree.id}
          onNodeExpansionToggle={handleToggle}
          expandedNodes={expanded}
          multiSelect
        >
          
          {renderTree(tree)}

        </SimpleTreeView>
      )
    })
  }, [ trees, handleToggle, expanded, renderTree])

  return (
    <>
      {treeViews}
    </>
  )
}

export default LayerTree
