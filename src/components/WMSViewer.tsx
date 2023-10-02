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

const WMSTileLayerCombined = ({ ...rest }: WMSLayerTreeProps): ReactNode => {
  const { selectedNodes, rawOgcService } = useTreeContext()
  const map = useMap()

  const getMapUrl: string = useMemo(() => { return rawOgcService?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url ?? '' }, [rawOgcService])

  const layers: string = useMemo(() => {
    // we call only the leafnodes
    const layerIdentifiers = selectedNodes.toSorted((a: RaRecord, b: RaRecord) => b.lft - a.lft).filter(node => Math.floor((node.rght - node.lft) / 2) === 0).map(node => node.identifier).filter(identifier => !(identifier === null || identifier === undefined))
    return layerIdentifiers.join(',') ?? ''
  }, [selectedNodes])

  if (layers === '' || getMapUrl === '') {
    return null
  }

  return (
    <WMSTileLayer

      url={getMapUrl}
      params={
        { layers }
      }
      // maxZoom={6}
      version={rawOgcService?.version === '' ? '1.3.0' : rawOgcService?.version}
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
    <TreeBase>
      <div>
        <Box id={containerId} sx={{ ...style }}>
          <MapContainer
            whenReady={() => { resizeMap(mapRef) }}
            center={[51.505, -0.09]}
            zoom={2}
            scrollWheelZoom={true}
            style={{ flex: 1, height: '100%', width: '100%' }}

          >
            <WMSTileLayerCombined />
          </MapContainer>
        </Box>
        <RightDrawer
          leftComponentId={containerId}
        >
          <OgcTreeView jsonApiParams={{ include: 'layers,operationUrls' }}><div></div></OgcTreeView>
        </RightDrawer>
      </div>
    </TreeBase >
  )
}

export default WMSViewer
