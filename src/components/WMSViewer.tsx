import { type ReactNode, type RefObject, useCallback, useEffect, useId, useMemo, useRef } from 'react'
import { type RaRecord, ShowBase, type SimpleShowLayoutProps, useGetOne, useRecordContext, useResourceDefinition } from 'react-admin'
import { MapContainer, useMap, WMSTileLayer } from 'react-leaflet'

import { Box } from '@mui/material'
import { type LeafletMap } from 'leaflet'

import OgcTreeView from './OGCTree/OGCTreeView'
import { TreeBase, useTreeContext } from './OGCTree/TreeContext'
import RightDrawer from './RightDrawer'

const style = {
  position: 'relative',
  //  display: 'flex',
  width: '100%',
  height: 'calc(100vh - 50px)'
  // maxHeight: 'calc(100vh - 50px !important)'

}

export interface WMSLayerTreeProps extends Partial<SimpleShowLayoutProps> {
}

const WMSLayerTree = ({ ...rest }: WMSLayerTreeProps): ReactNode => {
  const { name } = useResourceDefinition()
  const record = useRecordContext()
  const {
    data,
    isLoading,
    error,
    refetch

  } = useGetOne(
    name,
    {
      id: rest.record?.id ?? record?.id,
      meta: {
        jsonApiParams: { include: 'layers,operationUrls' }
      }
    }
  )
  const { selectedNodes, setFlatTree } = useTreeContext()

  const map = useMap()

  const getMapUrl: string = useMemo(() => { return data?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url }, [data])

  const layers: string = useMemo(() => {
    // we call only the leafnodes
    const layerIdentifiers = selectedNodes.sort((a: RaRecord, b: RaRecord) => b.lft - a.lft).filter(node => Math.floor((node.rght - node.lft) / 2) === 0).map(node => node.identifier).filter(identifier => !(identifier === null || identifier === undefined))
    return layerIdentifiers.join(',') ?? ''
  }, [selectedNodes])

  useEffect(() => {
    if (data !== undefined) {
      setFlatTree(data.layers?.sort((a: RaRecord, b: RaRecord) => a.lft - b.lft) ?? [])
    }
  }, [data])

  if (layers === '') {
    return null
  }

  return (
    <WMSTileLayer
      url={getMapUrl}
      params={
        { layers }
      }
      // maxZoom={6}
      version={data.version === '' ? '1.3.0' : data.version}
      // layers={layers}
      transparent={true}
      // tileSize={map.getSize()}
      format='image/png'
    // tms={false}

    // opacity={0}
    />

  )
}

const WMSViewer = ({ ...rest }: WmsClient): ReactNode => {
  const { name } = useResourceDefinition()

  const containerId = useId()
  const mapRef = useRef<LeafletMap>(null)

  const resizeMap = useCallback((mapRef: RefObject<LeafletMap>): void => {
    const resizeObserver = new ResizeObserver(() => mapRef.current?.invalidateSize())
    const container = document.getElementById('map-container')
    if (container != null) {
      resizeObserver.observe(container)
    }
  }, [])

  return (
    <div>
      <TreeBase>
        <ShowBase resource={name}>
          <div>
            <Box id={containerId} sx={{ ...style }}>
              <MapContainer
                whenReady={() => { resizeMap(mapRef) }}
                center={[51.505, -0.09]}
                zoom={2}
                scrollWheelZoom={true}
                style={{ flex: 1, height: '100%', width: '100%' }}

              >
                <WMSLayerTree />
              </MapContainer>
            </Box>
            <RightDrawer
              leftComponentId={containerId}
            >
              <OgcTreeView ><div></div></OgcTreeView>
            </RightDrawer>
          </div>
        </ShowBase>
      </TreeBase >
    </div>
  )
}

export default WMSViewer
