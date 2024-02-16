import { type ReactNode, useCallback, useId, useRef, type PropsWithChildren, useEffect, useMemo } from 'react'
import { type SimpleShowLayoutProps } from 'react-admin'
import { MapContainer, useMap } from 'react-leaflet'

import { Box } from '@mui/material'
import { type Map } from 'leaflet'

import BottomDrawer from '../Drawer/BottomDrawer'
import RightDrawer from '../Drawer/RightDrawer'
import { DrawerBase } from '../Drawer/DrawerContext'
import { MapViewerBase, useMapViewerContext } from './MapViewerContext'
import LayerTree from './LayerTree'
import { TabListBase } from '../Tab/TabListContext'
import { Tabs } from '../Tab/Tabs'
import ListGuesser from '../../jsonapi/components/ListGuesser'
import { useLeafletContext, useLayerLifecycle, createElementObject } from '@react-leaflet/core'
const style = {
  position: 'relative',
  //  display: 'flex',
  width: '100%',
  height: 'calc(100vh - 50px)'
  // maxHeight: 'calc(100vh - 50px !important)'
}

export interface WMSLayerTreeProps extends Partial<SimpleShowLayoutProps> {

}

const TileHandler = (): ReactNode => {
  const { tiles } = useMapViewerContext()
  const context = useLeafletContext()

  useEffect(() => {
    // removing all layers from leaflet context... otherwise the changes may not be present in leaflet context correctly such as order of services
    const container = (context.layerContainer != null) || context.map
    console.log('container:', container)

    console.log('leaflet layers', container._layers)

    // container.eachLayer(layer => { container.removeLayer(layer) })
  }, [tiles])

  return (<>
    {...tiles}
  </>)
}

const MapViewerCore = (): ReactNode => {
  const containerId = useId()
  const mapRef = useRef<Map>(null)

  const { updateOrAppendWmsTree } = useMapViewerContext()

  const resizeMap = useCallback((): void => {
    const resizeObserver = new ResizeObserver(() => mapRef.current?.invalidateSize())
    const container = document.getElementById('map-container')
    if (container != null) {
      resizeObserver.observe(container)
    }
  }, [])

  const displayMap = useMemo(() => (
    <MapContainer

      whenReady={() => { resizeMap() }}
      center={[51.505, -0.09]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ flex: 1, height: '100%', width: '100%' }}
    >
      <TileHandler/>

    </MapContainer>
  ), [resizeMap])

  return (
    <DrawerBase>
      <TabListBase>
        <Box id={containerId} sx={{ ...style }}>

          {displayMap}
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
          <Tabs
            defaultTabs={
              [{
                tab: { label: 'WMS List' },
                tabPanel: {
                  children: <ListGuesser
                    resource='WebMapService'
                    onRowClick={(resource) => {
                      updateOrAppendWmsTree({ id: resource.id })
                    }}
                  />
                }
              }]
            }
          />
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
