import { useEffect, useId, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from 'react'
import { type SimpleShowLayoutProps } from 'react-admin'
import { MapContainer, Marker, Popup, ScaleControl } from 'react-leaflet'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box } from '@mui/material'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import useResizeObserver from '@react-hook/resize-observer'
import { CRS, type LatLng, type Map } from 'leaflet'

import ListGuesser from '../../jsonapi/components/ListGuesser'
import { OwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase'
import BottomDrawer from '../Drawer/BottomDrawer'
import { DrawerBase } from '../Drawer/DrawerContext'
import RightDrawer from '../Drawer/RightDrawer'
import LayerTree from '../LayerTree/LayerTree'
import { TabListBase } from '../Tab/TabListContext'
import { Tabs } from '../Tab/Tabs'
import MapSettingsEditor from './MapSettings'
import { OwsContextActionButtons } from './OwsContextGuiActions/OwsContextActionButtons'
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
  const mapRef = useRef(map)
  //const { setMap: setMapContext } = useOwsContextBase()
  //const { tiles } = useOwsContextBase()
  //const tilesRef = useRef(tiles)

  const [featureInfoMarkerPosition, setFeatureInfoMarkerPosition] = useState<LatLng | undefined>(undefined)
  const [featureInfos, setFeatureInfos] = useState<any[]>([])

  const [size, setSize] = useState<DOMRectReadOnly>()
  const sizeRef = useRef<DOMRectReadOnly>()

  const featureInfoAccordions = useMemo(() => featureInfos.map((featureInfoHtml, index) => {
    return <Accordion
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
  }
  ), [featureInfos])

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
                // setFeatureInfoMarkerPosition(undefined)
                // setFeatureInfos([])
              }
            }
          }
        >
          {featureInfoAccordions}
        </Popup>
      </Marker>
    }
  }, [featureInfoMarkerPosition, featureInfos.length, featureInfoAccordions])

  useResizeObserver(map?.getContainer() ?? null, (entry) => { setSize(entry.contentRect) })

  // useEffect(() => {
  //   if (map !== undefined && map !== null && map !== mapRef.current) {
  //     // map has changed, so we need to pass it through the context
  //     mapRef.current = map
  //     //setMapContext(map)
  //     setSize(map.getContainer().getBoundingClientRect())
  //   }

  //   if (map !== undefined && map !== null && tiles !== undefined && tiles !== tilesRef.current) {
  //     //
  //     // map.on('click dragstart zoom', () => {
  //     //   setFeatureInfos([])
  //     // })
  //     map.removeEventListener('contextmenu')
  //     map.on('contextmenu', (event) => {
  //       const pointRightClick: Point = event.containerPoint
  //       setFeatureInfoMarkerPosition(event.latlng)

  //       const requests = tiles.map(tile => {
  //         const getFeatureinfoUrl = tile.getFeatureinfoUrl
  //         if (getFeatureinfoUrl?.searchParams.get('VERSION') === '1.3.0') {
  //           getFeatureinfoUrl?.searchParams.set('i', Math.round(pointRightClick.x).toString())
  //           getFeatureinfoUrl?.searchParams.set('j', Math.round(pointRightClick.y).toString())
  //         } else {
  //           getFeatureinfoUrl?.searchParams.set('x', Math.round(pointRightClick.x).toString())
  //           getFeatureinfoUrl?.searchParams.set('y', Math.round(pointRightClick.y).toString())
  //         }

  //         getFeatureinfoUrl?.searchParams.set('INFO_FORMAT', 'text/html')

  //         if (getFeatureinfoUrl !== undefined) {
  //           return getFeatureinfoUrl?.href
  //         }
  //         return ''
  //       // eslint-disable-next-line @typescript-eslint/promise-function-async
  //       }).filter(url => url !== '').map((url) => axios.get(url))

  //       const _featureInfos: any[] = []

  //       axios.all(requests).then(
  //         (responses) => {
  //           responses.forEach((response) => {
  //             if (response.data !== undefined) {
  //               _featureInfos.push(response.data)
  //             }
  //           })
  //           setFeatureInfos(_featureInfos)
  //         }
  //       ).catch(reason => { console.log(reason) })
  //     })
  //   }
  // }, [map, setMapContext, tiles])

  useEffect(() => {
    // on every size change, we need to tell the map context to invalidate the old size values.
    // Otherwise the getSize() will not provide correct information about the current map container size
    if (size !== undefined && map !== undefined && map !== null && size !== sizeRef.current) {
      sizeRef.current = size
      map.invalidateSize()
    }
  }, [size, map])

  return (
    <DrawerBase>
      <TabListBase>
        <Box id={containerId} sx={{ ...style }}>
          <MapContainer
            ref={setMap}
            center={[51.505, -0.09]}
            zoom={2}
            crs={CRS.EPSG4326}
            maxZoom={20}
            minZoom={0}
            maxBoundsViscosity={0.8}
            continuousWorld={true}
            scrollWheelZoom={true}
            style={{
              flex: 1, height: '100%', width: '100%', position: 'relative'
            }}
            
          >
            {/* {...tiles.map(tile => tile.leafletTile)} */}
            {featureInfoMarker}
            <ScaleControl position="topleft" />
          </MapContainer>
        </Box>
        <RightDrawer
          leftComponentId={containerId}
          callback={() => map?.invalidateSize()}
        >
          <OwsContextActionButtons />
          <LayerTree/>
        </RightDrawer>
        <BottomDrawer
          aboveComponentId={containerId}
          callback={() => map?.invalidateSize()}
        >
          <Tabs
            defaultTabs={
              [{
                tab: { label: 'Map Settings' },
                tabPanel: {
                  children: <MapSettingsEditor/>
                },
                closeable: false
              }, {
                tab: { label: 'WMS List' },
                tabPanel: {
                  children: <ListGuesser
                    resource='WebMapService'
                    onRowClick={(resource) => {
                      console.log('clicked: ',resource)
                    }}
                  />
                },
                closeable: false
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
    <OwsContextBase>
      <MapViewerCore />
      {children}
    </OwsContextBase>

  )
}

export default MapViewer
