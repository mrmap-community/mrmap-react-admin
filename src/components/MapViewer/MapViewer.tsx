import { useEffect, useId, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from 'react'
import { useStore, type SimpleShowLayoutProps } from 'react-admin'
import { ImageOverlay, MapContainer, Marker, Popup, ScaleControl } from 'react-leaflet'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box } from '@mui/material'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import useResizeObserver from '@react-hook/resize-observer'
import { CRS, type LatLng, type Map } from 'leaflet'
import proj4 from 'proj4'

import ListGuesser from '../../jsonapi/components/ListGuesser'
import { getOptimizedGetMapUrls, updateOrAppendSearchParam } from '../../ows-lib/OwsContext/utils'
import { OwsContextBase, useOwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase'
import BottomDrawer from '../Drawer/BottomDrawer'
import { DrawerBase } from '../Drawer/DrawerContext'
import RightDrawer from '../Drawer/RightDrawer'
import LayerTree from '../LayerTree/LayerTree'
import { TabListBase } from '../Tab/TabListContext'
import { Tabs } from '../Tab/Tabs'
import MapSettingsEditor from './MapSettings'
import { MapViewerBase, useMapViewerBase } from './MapViewerBase'
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

export interface Tile {
  leafletTile: ReactNode
  getMapUrl?: URL
  getFeatureinfoUrl?: URL
}

const MapViewerCore = (): ReactNode => {
  const containerId = useId()
  const [map, setMap] = useState<Map>()
  const [mapBounds, setMapBounds] = useState(map?.getBounds())
  const [mapSize, setMapSize] = useState(map?.getSize())  

  const [featureInfoMarkerPosition, setFeatureInfoMarkerPosition] = useState<LatLng | undefined>(undefined)
  const [featureInfos, setFeatureInfos] = useState<any[]>([])

  const [size, setSize] = useState<DOMRectReadOnly>()
  const sizeRef = useRef<DOMRectReadOnly>()

  const {addWMSByUrl} = useOwsContextBase()
  const { setMap: setMapContext, selectedCrs } = useMapViewerBase()

  const { trees } = useOwsContextBase()
  //const tilesRef = useRef(tiles)

  const [getCapabilititesUrls, setGetCapabilititesUrls] = useStore<string[]>(`mrmap.mapviewer.append.wms`, [])

  const atomicGetMapUrls = useMemo(()=>{
    return getOptimizedGetMapUrls(trees)
  }, [trees])

  const tiles = useMemo(() => {
    const _tiles: Tile[] = []

    if (mapBounds === undefined || mapSize === undefined) {
      return _tiles
    }
    const sw = mapBounds.getSouthWest()
    const ne = mapBounds.getNorthEast()
    let minXy = {x: sw.lng, y: sw.lat}
    let maxXy = {x: ne.lng, y: ne.lat}

    const getMapUrls = [...atomicGetMapUrls].reverse()

    if (selectedCrs.stringRepresentation !== 'EPSG:4326') {
      const proj = proj4('EPSG:4326', selectedCrs.wkt)
      minXy = proj.forward(minXy)
      maxXy = proj.forward(maxXy)
    }

    getMapUrls.forEach((atomicGetMapUrl, index) => {
      const params = atomicGetMapUrl.searchParams
      const version = params.get('version') ?? params.get('VERSION')

      if (version === '1.3.0') {
        if (selectedCrs.isXyOrder) {
          // no axis order correction needed.
          updateOrAppendSearchParam(params, 'BBOX', `${minXy.x},${minXy.y},${maxXy.x},${maxXy.y}`)
        } else {
          updateOrAppendSearchParam(params, 'BBOX',  `${minXy.y},${minXy.x},${maxXy.y},${maxXy.x}`)
        }
        updateOrAppendSearchParam(params, 'CRS',  selectedCrs.stringRepresentation)

      } else {
        // always minx,miny,maxx,maxy (minLng,minLat,maxLng,maxLat)
        updateOrAppendSearchParam(params, 'BBOX', `${minXy.x},${minXy.y},${maxXy.x},${maxXy.y}`)
        updateOrAppendSearchParam(params, 'SRS',  selectedCrs.stringRepresentation)
      }
      updateOrAppendSearchParam(params, 'WIDTH', mapSize.x.toString())
      updateOrAppendSearchParam(params, 'HEIGHT', mapSize.y.toString())
      updateOrAppendSearchParam(params, 'STYLES', '') // todo: shall be configureable
      _tiles.push(
        {
          leafletTile: <ImageOverlay
            key={(Math.random() + 1).toString(36).substring(7)}
            bounds={mapBounds}
            interactive={true}
            url={atomicGetMapUrl.href}
          />,
          getMapUrl: atomicGetMapUrl,
          getFeatureinfoUrl: undefined
        }
      )
    })
    
    return _tiles
  }, [mapBounds, mapSize, atomicGetMapUrls, selectedCrs])

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
  // }, [map, tiles])

  useEffect(() => {
    // on every size change, we need to tell the map context to invalidate the old size values.
    // Otherwise the getSize() will not provide correct information about the current map container size
    if (size !== undefined && map !== undefined && map !== null && size !== sizeRef.current) {
      sizeRef.current = size
      map.invalidateSize()
    }
  }, [size, map])

  useEffect(() => {
    if (map !== undefined && map !== null){
      setMapContext(map)
      setMapBounds(map.getBounds())
      setMapSize(map.getSize())
      map.addEventListener('resize moveend zoomend', (event) => {
        setMapBounds(map.getBounds())
        setMapSize(map.getSize())
      })
    }
  }, [map])

  useEffect(() => {
    if (getCapabilititesUrls.length > 0){
      getCapabilititesUrls.forEach(url => addWMSByUrl(url))
      setGetCapabilititesUrls([])
    }
  }, [getCapabilititesUrls])

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
              {...tiles.map(tile => tile.leafletTile)}
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
      <MapViewerBase>
        <MapViewerCore />
        {children}
      </MapViewerBase>
    </OwsContextBase>

  )
}

export default MapViewer
