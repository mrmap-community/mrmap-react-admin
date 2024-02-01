import { type ReactNode, useCallback, useId, useRef, type PropsWithChildren } from 'react'
import { type SimpleShowLayoutProps } from 'react-admin'
import { MapContainer } from 'react-leaflet'

import { Box } from '@mui/material'
import { type Map } from 'leaflet'

import BottomDrawer from '../Drawer/BottomDrawer'
import RightDrawer from '../Drawer/RightDrawer'
import { DrawerBase } from '../Drawer/DrawerContext'
import { MapViewerBase, useMapViewerContext } from './MapViewerContext'
import LayerTree from './LayerTree'
import { TabListBase } from '../Tab/TabListContext'

const style = {
  position: 'relative',
  //  display: 'flex',
  width: '100%',
  height: 'calc(100vh - 50px)'
  // maxHeight: 'calc(100vh - 50px !important)'
}

export interface WMSLayerTreeProps extends Partial<SimpleShowLayoutProps> {

}

const MapViewerCore = (): ReactNode => {
  const containerId = useId()
  const mapRef = useRef<Map>(null)

  const { tiles } = useMapViewerContext()

  const resizeMap = useCallback((): void => {
    const resizeObserver = new ResizeObserver(() => mapRef.current?.invalidateSize())
    const container = document.getElementById('map-container')
    if (container != null) {
      resizeObserver.observe(container)
    }
  }, [])

  return (
    <DrawerBase>
      <TabListBase>
        <Box id={containerId} sx={{ ...style }}>

          <MapContainer
            whenReady={() => { resizeMap() }}
            center={[51.505, -0.09]}
            zoom={2}
            scrollWheelZoom={true}
            style={{ flex: 1, height: '100%', width: '100%' }}
          >
            {...tiles}

          </MapContainer>
        </Box>
        <RightDrawer
          leftComponentId={containerId}
          callback={resizeMap}
        >
          <LayerTree />
        </RightDrawer>
        <BottomDrawer
          aboveComponentId={containerId}
          callback={resizeMap}
        >

        </BottomDrawer>
      </TabListBase>
    </DrawerBase>
  )
}

const MapViewer = ({ children }: PropsWithChildren): ReactNode => {
  return (
    <MapViewerBase>
      <MapViewerCore />
      {children}
    </MapViewerBase>

  )
}

export default MapViewer
