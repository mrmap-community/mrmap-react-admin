import { type ReactNode, useCallback, useId, type PropsWithChildren, useMemo, useState, useEffect } from 'react'
import { fetchUtils, useStore, type SimpleShowLayoutProps } from 'react-admin'
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

const getFeatureInfoCall = async (): Promise<void> => {
  const response = await fetch('http://example.com/movies.json')

  console.log(response)
}

const MapViewerCore = (): ReactNode => {
  const containerId = useId()
  const [map, setMap] = useState<Map>()
  const { updateOrAppendWmsTree } = useMapViewerContext()
  const { tiles } = useMapViewerContext()
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false)
  const [toolbarIsOpen] = useStore('sidebar.open')

  useEffect(() => {
    console.log('size old:', map?.getSize())
    map?.invalidateSize()
    console.log('size new:', map?.getSize())
  }, [map, toolbarIsOpen])

  const displayMap = useMemo(() => (
    <MapContainer
      ref={(m) => { setMap(m ?? undefined) }}

      center={[51.505, -0.09]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ flex: 1, height: '100%', width: '100%' }}
    >
      {...tiles}
    </MapContainer>
  ), [tiles])

  useEffect(() => {
    console.log('map changed')

    if (map !== undefined) {
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
