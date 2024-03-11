import { type ReactNode, useId, type PropsWithChildren, useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { type SimpleShowLayoutProps } from 'react-admin'
import { MapContainer, Popup, Marker } from 'react-leaflet'

import { Box } from '@mui/material'
import { type LatLng, type Map, type Point } from 'leaflet'

import BottomDrawer from '../Drawer/BottomDrawer'
import RightDrawer from '../Drawer/RightDrawer'
import { DrawerBase } from '../Drawer/DrawerContext'
import { MapViewerBase, useMapViewerContext } from './MapViewerContext'
import LayerTree from './LayerTree'
import { TabListBase } from '../Tab/TabListContext'
import { Tabs } from '../Tab/Tabs'
import ListGuesser from '../../jsonapi/components/ListGuesser'
import useResizeObserver from '@react-hook/resize-observer'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import axios from 'axios'

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
  const { setMap: setMapContext, updateOrAppendWmsTree } = useMapViewerContext()
  const { tiles } = useMapViewerContext()

  const [featureInfoMarkerPosition, setFeatureInfoMarkerPosition] = useState<LatLng | undefined>(undefined)
  const [featureInfos, setFeatureInfos] = useState<any[]>([])

  const [size, setSize] = useState<DOMRectReadOnly>()

  const featureInfoMarker = useMemo(() => {
    if (featureInfoMarkerPosition !== undefined && featureInfos.length > 0) {
      return <Marker
      position={featureInfoMarkerPosition}
      >
      <Popup
        minWidth={90}

        eventHandlers={
          {

            remove: () => {
              const position = featureInfoMarkerPosition
              setFeatureInfoMarkerPosition(undefined)
              setFeatureInfos([])
              map?.flyTo(position)
            }
          }
        }
      >
        {featureInfos.map((featureInfoHtml, index) => {
          return (
            <Accordion
              key={index}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${index}-content`}
                id={`${index}-header`}
              >
               {index}
              </AccordionSummary>
              <AccordionDetails
                dangerouslySetInnerHTML={{ __html: featureInfoHtml }}
              />
            </Accordion>
          )
        })}
      </Popup>
    </Marker>
    }
  }, [featureInfoMarkerPosition, featureInfos, map])

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
      {featureInfoMarker}
    </MapContainer>
  ), [tiles, featureInfoMarker])

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
        })
      }
      map.removeEventListener('contextmenu')

      map.on('contextmenu', (event) => {
        const pointRightClick: Point = event.containerPoint
        setFeatureInfoMarkerPosition(event.latlng)
        setFeatureInfos([])
        // ToDo: do a getfeatureinfo call to all wms layers

        tiles.forEach(tile => {
          const getFeatureinfoUrl = tile.getFeatureinfoUrl
          getFeatureinfoUrl?.searchParams.set('x', Math.round(pointRightClick.x).toString())
          getFeatureinfoUrl?.searchParams.set('y', Math.round(pointRightClick.y).toString())
          getFeatureinfoUrl?.searchParams.set('INFO_FORMAT', 'text/html')

          if (getFeatureinfoUrl !== undefined) {
            axios.get(getFeatureinfoUrl?.href)
              .then(response => {
                if (response.data !== undefined) {
                  const _featureInfos = featureInfos
                  // TODO: handle content by info format check
                  _featureInfos.push(response.data)
                  setFeatureInfos(featureInfos)
                }
              })
              .catch(error => { console.log(error) })
          }
        })
      })
    }
  }, [featureInfos, map, tiles])

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
