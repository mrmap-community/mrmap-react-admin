import { type ReactNode, useCallback, useId, useMemo, useRef } from 'react'
import { type RaRecord, type SimpleShowLayoutProps, TextField } from 'react-admin'
import { MapContainer, WMSTileLayer } from 'react-leaflet'

import { Box } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { type Map } from 'leaflet'

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
  // const map = useMap()

  const getMapUrl: string = useMemo(() => { return rawOgcService?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url ?? '' }, [rawOgcService])

  const layers: string = useMemo(() => {
    // we call only the leafnodes
    const layerIdentifiers = selectedNodes.filter(node => Math.floor((node.rght - node.lft) / 2) === 0).map(node => node.identifier).filter(identifier => !(identifier === null || identifier === undefined))
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
      zoomOffset={-1}
      format='image/png'
      noWrap
    // tms={false}

    // opacity={0}

    />

  )
}

const WMSViewerCore = (): ReactNode => {
  const containerId = useId()
  const mapRef = useRef<Map>(null)

  const resizeMap = useCallback((): void => {
    const resizeObserver = new ResizeObserver(() => mapRef.current?.invalidateSize())
    const container = document.getElementById('map-container')
    if (container != null) {
      resizeObserver.observe(container)
    }
  }, [])

  const { flatTree } = useTreeContext()

  const availableCrs = useMemo(() => {
    return flatTree?.[0]?.referenceSystems ?? []
  }, [flatTree])

  return (
    <div>
      <Box id={containerId} sx={{ ...style }}>
        <Autocomplete
          disablePortal
          id="combo-box-demo"
          options={availableCrs}
          sx={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Movie" />}
        />
        <MapContainer
          whenReady={() => { resizeMap() }}
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
        callback={resizeMap}
      >
        <OgcTreeView jsonApiParams={{ include: 'layers,operationUrls' }}><div></div></OgcTreeView>
      </RightDrawer>
    </div>
  )
}

const WMSViewer = (): ReactNode => {
  return (
    <TreeBase>
      <WMSViewerCore />

    </TreeBase >
  )
}

export default WMSViewer
