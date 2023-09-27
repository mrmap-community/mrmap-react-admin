import { type ReactNode, type RefObject, useId, useRef } from 'react'
import { MapContainer, WMSTileLayer } from 'react-leaflet'

import { Box } from '@mui/material'
import { type LeafletMap } from 'leaflet'

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

const WMSViewer = ({ ...rest }: WmsClient): ReactNode => {
  const id = useId()
  const mapRef = useRef<LeafletMap>(null)
  return (
    <div>
      <Box id={id} sx={{ ...style }}>
        <MapContainer
          whenReady={() => { resizeMap(mapRef) }}
          center={[51.505, -0.09]}
          zoom={2}
          scrollWheelZoom={true}
          style={{ flex: 1, height: '100%', width: '100%' }}

        >
          <WMSTileLayer
            // layers={'dwd:Cwam_reg025_fd_sl_DD10M'}
            url={'https://geo5.service24.rlp.de/wms/karte_rp.fcgi'}
            params={
              {
                version: '1.3.0',
                layers: 'atkis1'
              }
            }
            // params={{ hello: 'world' }} // <-- comment out this line to stop the map flickering when the button is pressed
            // maxZoom={6}
            // transparent={true}
            format='image/png'
          // opacity={0}
          />

        </MapContainer>
      </Box>
      <RightDrawer
        leftComponentId={id}
      >

      </RightDrawer>
    </div>
  )
}

export default WMSViewer
