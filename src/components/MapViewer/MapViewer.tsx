import { type ReactNode, useId, type PropsWithChildren, useMemo, useState, useEffect, useLayoutEffect } from 'react'
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
import useResizeObserver from '@react-hook/resize-observer'
const style = {
  position: 'relative',
  //  display: 'flex',
  width: '100%',
  height: 'calc(100vh - 50px)'
  // maxHeight: 'calc(100vh - 50px !important)'
}

export interface WMSLayerTreeProps extends Partial<SimpleShowLayoutProps> {

}

const getFeatureInfoCall = async (): Promise<void> => {
  const response = await fetch('http://example.com/movies.json')

  console.log(response)
}

const MapViewerCore = (): ReactNode => {
  const containerId = useId()
  const [map, setMap] = useState<Map>()
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false)
  const { setMap: setMapContext, updateOrAppendWmsTree } = useMapViewerContext()
  const { tiles } = useMapViewerContext()

  const [size, setSize] = useState<DOMRectReadOnly>()

  const displayMap = useMemo(() => (
    // TODO: ignore the ts error for ref... react leaflet expects a state setter here
    <MapContainer
      ref={setMap}
      center={[51.505, -0.09]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ flex: 1, height: '100%', width: '100%' }}
    >
      {...tiles.map(tile => tile.leafletTile)}
    </MapContainer>
  ), [tiles])

  const mapContainer = useMemo(() => map?.getContainer() ?? null, [map])

  useLayoutEffect(() => {
    if (mapContainer !== null) {
      setSize(mapContainer.getBoundingClientRect())
    }
  }, [mapContainer])

  useResizeObserver(map?.getContainer() ?? null, (entry) => { setSize(entry.contentRect) })

  useEffect(() => {
    // on every size change, we need to tell the map context to invalidate the old size values.
    // Otherwise the getSize() will not provide correct information about the current map container size
    if (size !== undefined && map !== undefined) {
      map.invalidateSize()
      setMapContext(map)
    }
  }, [size, map, setMapContext])

  useEffect(() => {
    if (map !== undefined && map !== null) {
      if (!map.hasEventListeners('click dragstart zoom')) {
        map.on('click dragstart zoom', () => {
          // disable ob click, dragstart and zoom
          setIsShowMenu(false)
        })
      }
      map.removeEventListener('contextmenu')

      map.on('contextmenu', (event) => {
        const pointRightClick: Point = event.containerPoint

        const latlng = map.mouseEventToLatLng(event.originalEvent)

        // ToDo: do a getfeatureinfo call to all wms layers

        console.log('event', event, 'size', map.getSize(), 'point', pointRightClick, 'latlng', latlng)
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
          callback={() => map?.invalidateSize()}
        >
          <LayerTree map={map}/>
        </RightDrawer>
        <BottomDrawer
          aboveComponentId={containerId}
          callback={() => map?.invalidateSize()}
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
