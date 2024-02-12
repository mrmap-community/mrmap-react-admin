import { type RaRecord, useGetOne } from 'react-admin'
import MapViewer from '../MapViewer/MapViewer'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { type TreeNode, useMapViewerContext } from '../MapViewer/MapViewerContext'
import { getChildren } from '../MapViewer/utils'
import { useSearchParams } from 'react-router-dom'

export interface WmsSyncHandlerProps {
  id: string
}

const WmsSyncHandler = ({ id }: WmsSyncHandlerProps): null => {
  const { wmsTrees, setWmsTrees } = useMapViewerContext()

  const { data: record, isLoading, error, refetch } = useGetOne(
    'WebMapService',
    {
      id,
      meta: {
        jsonApiParams: {
          include: 'layers,operationUrls,layers.referenceSystems',
          'fields[Layer]': 'title,mptt_lft,mptt_rgt,mptt_depth,referemce_systems,service,is_spatial_secured,_is_secured,identifier'
        }
      }
    }
  )

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
        rootNode: raRecordToNode(record?.layers?.find((node: RaRecord) => node.mpttLft === 1)),
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

const WmsViewerCore = (): ReactNode => {
  const [searchParams] = useSearchParams()

  const [wmsIds, setWmsIds] = useState<string[]>([])

  useEffect(() => {
    const wmsParam = searchParams?.get('wms')

    if (wmsParam !== undefined) {
      const ids = wmsParam?.split(',') ?? []
      setWmsIds(ids)
    }
  }, [searchParams])

  const wmsSyncHandlers = useMemo(() => {
    const _wmsSyncHandlers = []
    for (const id of wmsIds) {
      _wmsSyncHandlers.push(<WmsSyncHandler id={id} />)
    }
    return _wmsSyncHandlers
  }, [wmsIds])

  return <>
    {...wmsSyncHandlers}
  </>
}

const WmsViewer = (): ReactNode => {
  return (
    <MapViewer>
      <WmsViewerCore />
    </MapViewer>
  )
}

export default WmsViewer
