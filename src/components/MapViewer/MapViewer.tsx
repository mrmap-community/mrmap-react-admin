import { type ReactNode, useCallback, useId, type PropsWithChildren, useMemo, useState, useEffect } from 'react'
import { type SimpleShowLayoutProps } from 'react-admin'
import { MapContainer } from 'react-leaflet'

import { Box } from '@mui/material'
import { type Map, type Point } from 'leaflet'

import BottomDrawer from '../Drawer/BottomDrawer'
import RightDrawer from '../Drawer/RightDrawer'
import { DrawerBase } from '../Drawer/DrawerContext'
import { MapViewerBase, useMapViewerContext } from './MapViewerContext'
import LayerTree from './LayerTree'
import { TabListBase } from '../Tab/TabListContext'
import { Tabs } from '../Tab/Tabs'
import ListGuesser from '../../jsonapi/components/ListGuesser'
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
  const [map, setMap] = useState<Map>()
  const { updateOrAppendWmsTree } = useMapViewerContext()
  const { tiles } = useMapViewerContext()
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false)

  const resizeMap = useCallback((): void => {
    const resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    const container = document.getElementById('map-container')
    if (container != null) {
      resizeObserver.observe(container)
    }
  }, [map])

  const displayMap = useMemo(() => (
    <MapContainer
      ref={(m) => { setMap(m ?? undefined) }}
      whenReady={() => { resizeMap() }}
      center={[51.505, -0.09]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ flex: 1, height: '100%', width: '100%' }}
    >
      {...tiles}
    </MapContainer>
  ), [resizeMap, tiles])

  useEffect(() => {
    if (map !== undefined) {
      const mapSize = map.getSize()

      map.on('click dragstart zoom', () => {
        // disable ob click, dragstart and zoom
        setIsShowMenu(false)
      })

      map.on('contextmenu', (event) => {
        const pointRightClick: Point = event.containerPoint

        const latlng = map.mouseEventToLatLng(event.originalEvent)

        // ToDo: do a getfeatureinfo call to all wms layers

        console.log(event, pointRightClick, latlng)
        setIsShowMenu(true)
      })
    }
  }, [map])

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
          <LayerTree map={map}/>
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
