import { type RaRecord, useShowController } from 'react-admin'
import MapViewer from '../MapViewer/MapViewer'
import { type ReactNode, useCallback, useEffect, useId, useMemo } from 'react'
import { type TreeNode, useMapViewerContext } from '../MapViewer/MapViewerContext'
import { getChildren } from '../MapViewer/utils'

const WmsViewerCore = (): null => {
  const { wmsTrees, setWmsTrees } = useMapViewerContext()

  const id = useId()

  const {
    isLoading, // boolean that is true until the record is available for the first time
    record, // record fetched via dataProvider.getOne() based on the id from the location
    refetch // callback to refetch the record via dataProvider.getOne()
  } = useShowController({ queryOptions: { meta: { jsonApiParams: { include: 'layers,operationUrls,layers.referenceSystems' } } } })

  const raRecordToNode = useCallback((node: RaRecord): TreeNode => {
    return {
      id: node?.id,
      name: node?.title,
      // TODO:
      children: getChildren(record?.layers ?? [], node).map(n => raRecordToNode(n)),
      record: node
    }
  }, [record?.layers])

  const topDownTree = useMemo(() => {
    if (record !== undefined) {
      return {
        id: record?.id ?? id,
        rootNode: raRecordToNode(record?.layers?.find((node: RaRecord) => node.lft === 1)),
        record,
        checkedNodes: []
      }
    }
  }, [record])

  useEffect(() => {
    if (topDownTree !== undefined) {
      setWmsTrees([...wmsTrees?.filter(tree => tree.id !== topDownTree.id) ?? [], topDownTree])
    }
  }, [topDownTree])

  return null
}

const WmsViewer = (): ReactNode => {
  return (
    <MapViewer>
      <WmsViewerCore />
    </MapViewer>
  )
}

export default WmsViewer
