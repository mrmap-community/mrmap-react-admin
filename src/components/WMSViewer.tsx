import { type ReactNode, type RefObject, useEffect, useId, useMemo, useRef } from 'react'
import { type RaRecord, ShowBase, type SimpleShowLayoutProps, useGetOne, useRecordContext, useResourceDefinition } from 'react-admin'
import { LayersControl, MapContainer, WMSTileLayer } from 'react-leaflet'

import { Box } from '@mui/material'
import { type LeafletMap } from 'leaflet'

import OgcTreeView from './OGCTree/OGCTreeView'
import { TreeBase, useTreeContext } from './OGCTree/TreeContext'
import RightDrawer from './RightDrawer'

const style = {
  position: 'relative',
  //  display: 'flex',
  width: '100%',
  height: '100vh',
  maxHeight: 'calc(100vh - 50px !important)'

}

const resizeMap = (mapRef: RefObject<LeafletMap>): void => {
  const resizeObserver = new ResizeObserver(() => mapRef.current?.invalidateSize())
  const container = document.getElementById('map-container')
  if (container != null) {
    resizeObserver.observe(container)
  }
}

export interface WmsClient {

}

const WMSLayerTree = ({ ...rest }: Partial<SimpleShowLayoutProps>): ReactNode => {
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

  useEffect(() => {
    if (data !== undefined) {
      setFlatTree(data.layers?.sort((a: RaRecord, b: RaRecord) => a.lft - b.lft) ?? [])
    }
  }, [data])

  const getMapUrl: string = useMemo(() => { return data?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url }, [data])

  const layers: string = useMemo(() => {
    // we call only the leafnodes
    const layerIdentifiers = selectedNodes.sort((a: RaRecord, b: RaRecord) => b.lft - a.lft).filter(node => Math.floor((node.rght - node.lft) / 2) === 0).map(node => node.identifier).filter(identifier => !(identifier === null || identifier === undefined))
    console.log(layerIdentifiers)
    return layerIdentifiers.join(',') ?? ''
  }, [selectedNodes])

  if (layers === '') {
    return null
  }

  return (
    <WMSTileLayer
      // layers={'dwd:Cwam_reg025_fd_sl_DD10M'}
      url={getMapUrl}
      params={
        {
          version: '1.3.0',
          layers
        }
      }
      // params={{ hello: 'world' }} // <-- comment out this line to stop the map flickering when the button is pressed
      // maxZoom={6}
      // transparent={true}
      format='image/png'
    // opacity={0}
    />
  )
}

const WMSViewer = ({ ...rest }: WmsClient): ReactNode => {
  const { name } = useResourceDefinition()

  const containerId = useId()
  const mapRef = useRef<LeafletMap>(null)

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
