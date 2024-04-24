import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState, type PropsWithChildren, useCallback, useMemo, useEffect, useRef } from 'react'
import { type RaRecord, type Identifier, useDataProvider, useGetOne } from 'react-admin'
import { ImageOverlay } from 'react-leaflet'
import FeatureGroupEditor from '../FeatureGroupEditor'
import type { MultiPolygon, Polygon } from 'geojson'
import { getChildren } from '../MapViewer/utils'
import { LatLngBounds, Point, type Map } from 'leaflet'
import proj4 from 'proj4'
import L from 'leaflet'
import { CreatorDisplay, OWSContext, OWSResource, TreeifiedOWSResource } from '../../OwsContext/types'
import { OWSContextDocument, getNextRootId, getOptimizedGetMapUrls, isDescendantOf, treeify, wmsToOWSResources } from '../../OwsContext/utils'
import { parseWms } from '../../XMLParser/parseCapabilities'
import { BBox } from 'geojson'
import _ from 'lodash'

export interface StoredWmsTree {
  id: Identifier
  checkedNodes: Identifier[]
}

export interface MrMapCRS extends RaRecord {
  stringRepresentation: string
  code: string
  prefix: string
  wkt?: string
  bbox?: Polygon
  isYxOrder: boolean
  isXyOrder: boolean
}

export interface TreeNode {
  id: Identifier
  name?: string
  children: TreeNode[]
  record?: RaRecord
}

export interface WMSTree {
  id: Identifier
  rootNode?: TreeNode
  record?: RaRecord
  checkedNodes: TreeNode[]
}

export interface Tile {
  leafletTile: ReactNode
  getMapUrl?: URL
  getFeatureinfoUrl?: URL
}



export interface MapViewerContextType {
  tiles: Tile[]
  crsIntersection: MrMapCRS[]
  selectedCrs: MrMapCRS
  setSelectedCrs: (crs: MrMapCRS) => void
  setEditor: Dispatch<SetStateAction<boolean>>
  geoJSON: MultiPolygon | undefined
  setGeoJSON: Dispatch<SetStateAction<MultiPolygon | undefined>>
  map?: Map
  setMap: Dispatch<SetStateAction<Map>>
  features: OWSResource[]
  owsContext: OWSContext

  addWMSByUrl: (url: string) => void
  initialFromOwsContext: (url: string) => void
  trees: TreeifiedOWSResource[]
  activeFeatures: OWSResource[]
  setFeatureActive: (folder: string, active: boolean) => void
}

export const context = createContext<MapViewerContextType | undefined>(undefined)

const raRecordToNode = (node: RaRecord, tree: RaRecord): TreeNode => {
  return {
    id: node?.id,
    name: node?.title,
    children: getChildren(tree?.layers ?? [], node).map(n => raRecordToNode(n, tree)),
    record: node
  }
}

const raRecordToTopDownTree = (node: RaRecord): WMSTree => {
  return {
    id: node.id,
    rootNode: raRecordToNode(node?.layers?.find((node: RaRecord) => node.mpttLft === 1), node),
    record: node,
    checkedNodes: []
  }
}

const prepareGetMapUrl = (getMapUrl: URL, size: L.Point, bounds: LatLngBounds, crs: MrMapCRS): URL => {
  
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  let minXy = {x: sw.lng, y: sw.lat}
  let maxXy = {x: ne.lng, y: ne.lat}

  if (crs.stringRepresentation !== 'EPSG:4326' && crs.stringRepresentation !== '') {
    const proj = proj4('EPSG:4326', crs.wkt)
    minXy = proj.forward(minXy)
    maxXy = proj.forward(maxXy)
  }
  const url = new URL(getMapUrl)
  const params = url.searchParams

  const version = params.get('VERSION') ?? params.get('version') ?? '1.3.0' 

  if (!(params.has('SERVICE') || params.has('service'))) {
    params.append('SERVICE', 'WMS')
  }

  if (!(params.has('VERSION') || params.has('version'))) {
    params.append('VERSION', version)
  }

  if (!(params.has('REQUEST') || params.has('request'))) {
    params.append('REQUEST', 'GetMap')
  }

  if (!(params.has('FORMAT') || params.has('format'))) {
    params.append('FORMAT', 'image/png')
  }

  if (!(params.has('TRANSPARENT') || params.has('transparent'))) {
    // make it configurable
    params.append('TRANSPARENT', 'true')
  }

  if (!(params.has('STYLES') || params.has('styles'))) {
    // make it configurable
    params.append('STYLES', '')
  }

  if (version === '1.3.0') {
    if (crs.isXyOrder) {
      // no axis order correction needed.
      params.set('BBOX', `${minXy.x},${minXy.y},${maxXy.x},${maxXy.y}`)
    } else {
      params.set('BBOX', `${minXy.y},${minXy.x},${maxXy.y},${maxXy.x}`)
    }
    if (!(params.has('CRS') || params.has('crs'))) {
      params.append('CRS', crs.stringRepresentation)
    }
  } else {
    // always minx,miny,maxx,maxy (minLng,minLat,maxLng,maxLat)
    params.set('BBOX', `${minXy.x},${minXy.y},${maxXy.x},${maxXy.y}`)
    if (!(params.has('SRS') || params.has('srs'))) {
      params.append('SRS', crs.stringRepresentation)
    }
  }

  params.set('WIDTH', size.x.toString())
  params.set('HEIGHT', size.y.toString())

  return url
}

const prepareGetFeatureinfoUrl = (getMapUrl: URL, getFeatureinfoUrl: string, tree: WMSTree, queryLayers: string[]): URL | undefined => {
  if (getFeatureinfoUrl === '') {
    return undefined
  }

  const url = new URL(getFeatureinfoUrl)
  const params = url.searchParams
  const version = tree.record?.version === '' ? '1.3.0' : tree.record?.version

  if (!(params.has('SERVICE') || params.has('service'))) {
    params.append('SERVICE', 'WMS')
  }

  if (!(params.has('VERSION') || params.has('version'))) {
    params.append('VERSION', version)
  }

  if (!(params.has('REQUEST') || params.has('request'))) {
    params.append('REQUEST', 'GetFeatureInfo')
  }

  params.append('LAYERS', getMapUrl.searchParams.get('LAYERS'))
  params.append('QUERY_LAYERS', queryLayers?.join(',') ?? '')
  params.append('STYLES', getMapUrl.searchParams.get('STYLES'))
  params.append('BBOX', getMapUrl.searchParams.get('BBOX'))
  params.append('SRS', getMapUrl.searchParams.get('SRS') ?? getMapUrl.searchParams.get('CRS') ?? 'EPSG:4326')
  params.append('WIDTH', getMapUrl.searchParams.get('WIDTH'))
  params.append('HEIGHT', getMapUrl.searchParams.get('HEIGHT'))

  return url
}

const boundsToBbox = (bounds: LatLngBounds): BBox => [bounds.getSouthWest().lng, bounds.getSouthWest().lat, bounds.getNorthEast().lng, bounds.getNorthEast().lat]

const bboxToBounds = (bbox: BBox): LatLngBounds => new LatLngBounds({lat: bbox[1], lng: bbox[0]}, {lat: bbox[3], lng: bbox[2]})

const sizeToDisplay = (size: Point): CreatorDisplay => {
  return {
    pixelWidth: size.x,
    pixelHeight: size.y
  }
}

export const MapViewerBase = ({ children }: PropsWithChildren): ReactNode => {
  /** map specific states */
  const [map, setMap] = useState<Map>()

  const [maxBounds, setMaxBounds] = useState<LatLngBounds>()

  /** ows context */

  // area of interest in crs 4326
  const [bbox, setBbox] = useState<BBox>(map?.getBounds() ? boundsToBbox(map.getBounds()) : [-180, -90, 180, 90])
  const [display, setDisplay] = useState<CreatorDisplay>(map?.getSize() ? sizeToDisplay(map.getSize()): {})
  const [features, setFeatures] = useState<OWSResource[]>([])
  
  const owsContext = useMemo(()=>{
    const doc = OWSContextDocument()
    
    return {
      ...doc,
      ...(bbox && {bbox: bbox}),
      ...(features && {features: bbox}),
      ...(display && {properties: {...doc.properties, display: display}})
    }
  }, [bbox, features])

  
  const trees = useMemo(() => {
    return treeify(features)
  }, [features])

  const getMapUrls = useMemo(()=>{
    return getOptimizedGetMapUrls(trees)
  }, [trees])

  const activeFeatures = useMemo(()=>{
    return features.filter(feature => feature.properties.active === true)
  }, [features])


  /** editor */
  const [editor, setEditor] = useState<boolean>(false)
  const [geoJSON, setGeoJSON] = useState<MultiPolygon>()


  /** crs handling*/
  const [_selectedCrs, setSelectedCrs] = useState<MrMapCRS>()

  const dataProvider = useDataProvider()
  const { data: selectedCrs, isLoading, error, refetch } = useGetOne(
    'ReferenceSystem',
    { id: _selectedCrs?.id }
  )

  const crsIntersection = useMemo(() => {
    // TODO: refactor this by using the crs from the ows context resources
    let referenceSystems: MrMapCRS[] = []
    /* wmsTrees.map(wms => wms.rootNode?.record.referenceSystems.filter((crs: MrMapCRS) => crs.prefix === 'EPSG')).forEach((_referenceSystems: MrMapCRS[], index) => {
      if (index === 0) {
        referenceSystems = referenceSystems.concat(_referenceSystems)
      } else {
        referenceSystems = referenceSystems.filter(crsA => _referenceSystems.some(crsB => crsA.stringRepresentation === crsB.stringRepresentation))
      }
    }) */
    return referenceSystems
  }, [owsContext])


  // TODO: this is viewer specific stuff; move this outside
  const tiles = useMemo(() => {
    const _tiles: Tile[] = []


    if (bbox === undefined || display?.pixelWidth === undefined || display?.pixelHeight === undefined || getMapUrls === undefined) {
      return _tiles
    }

    [...getMapUrls].reverse().forEach(url => {

      // TODO: how to implement getFeatureinfoUrl here from owscontext as path of truth

      //const queryableLayers = checkedLayers?.filter(node => node.record.isQueryable)
      //const queryableLayerIdentifiers = queryableLayers?.map(node => node.record?.identifier).filter(identifier => !(identifier === null || identifier === undefined)) ?? []
      //const getFeatureinfoUrl: string = tree.record?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetFeatureInfo' && operationUrl.method === 'Get')?.url ?? ''
      const bounds = bboxToBounds(bbox)
      const getMapUrl = prepareGetMapUrl(url, {x: display.pixelWidth, y: display.pixelHeight}, bounds, { code: '4326', prefix: 'EPSG', stringRepresentation: 'EPSG:4326', isYxOrder: true, isXyOrder: false, id: 4326 })

      _tiles.push(
        {
          leafletTile: <ImageOverlay
          key={(Math.random() + 1).toString(36).substring(7)}
          bounds={bounds}
          interactive={true}
          url={getMapUrl.href}
        />,
          getMapUrl: getMapUrl,
          //getFeatureinfoUrl: prepareGetFeatureinfoUrl(_getMapUrl, getFeatureinfoUrl, tree, queryableLayerIdentifiers)
        }
      )
      
    })
    return _tiles
  }, [getMapUrls, display, bbox, selectedCrs])

  const editorLayer = useMemo(() => {
    return {
      leafletTile: <FeatureGroupEditor
        geoJson={geoJSON}
        geoJsonCallback={(multiPolygon) => { setGeoJSON(multiPolygon) }}
        />
    }
  }, [geoJSON])

  const addWMSByUrl = useCallback((url: string)=>{
    const request = new Request(url, {
      method: 'GET',
    })
    fetch(request).then(response => response.text()).then(xmlString => {
      
      const nextRootId = getNextRootId(features)
      
      const parsedWms = parseWms(xmlString)
      const additionalFeatures = wmsToOWSResources(parsedWms, nextRootId)

      setFeatures([...features, ...additionalFeatures])

    }      
  )
  }, [features])

  const initialFromOwsContext = useCallback((url: string)=>{
    const request = new Request(url, {
      method: 'GET',
    })
    fetch(request).then(response => response.json()).then((json: any) => {
      // todo: check type before setting features.
      // todo: set also other variables
      setFeatures(json.features)
      json.bbox && setBbox(json.bbox)

      // TODO: initial map with current display if exists  map?.fitBounds()
    }      
  )
  }, [])

  const setFeatureActive = useCallback((folder: string, active: boolean)=>{
    const feature = features.find(feature => feature.properties.folder === folder)

    if (feature !== undefined){
      feature.properties.active = active
      // activate all descendants
      features.forEach(possibleDescendant => {
        if (isDescendantOf(feature, possibleDescendant)){
          possibleDescendant.properties.active = active
        } 
      })
      if (active === false) {
        const parent = features.find(parent => parent.properties.folder === folder.split('/').slice(0,-1).join('/'))
        if (parent !== undefined) parent.properties.active = false
      }
      setFeatures([...features])
    }
  }, [features])


  const updateBbox = useCallback((bounds: LatLngBounds) => {
    const newBbox = boundsToBbox(bounds)
    !_.isEqual(bbox, newBbox) && setBbox(newBbox)
  },[bbox])

  const updateDisplay = useCallback((size: Point) => {
    const newDisplay = sizeToDisplay(size)
    !_.isEqual(display, newDisplay) && setDisplay(newDisplay)
  }, [display])

  const moveFeature = useCallback((feature: OWSResource, target: OWSResource, position: Position = Position.lastChild)=>{


    
    const treeA = features.filter(feature => {
      if (feature.properties.folder === undefined) return false

      feature.properties.folder?.split('/')?.[1] === currentIndex
    })

  },[])

  useEffect(() => {
    // initial if map is there
    map?.getBounds() && updateBbox(map.getBounds())
    map?.getSize() && updateDisplay(map.getSize())

    map?.addEventListener('resize moveend zoomend', (event) => {
      updateBbox(map.getBounds())
      updateDisplay(map.getSize())
    })
  }, [map])

  useEffect(() => {

    if (selectedCrs?.bbox !== undefined) {
      const bbox = JSON.parse(selectedCrs?.bbox)
      const bboxGeoJSON = L.geoJSON(bbox)
      const newMaxBounds = bboxGeoJSON.getBounds()
      setMaxBounds(newMaxBounds)
    }
  }, [selectedCrs])

  useEffect(() => {
    if (maxBounds !== undefined && map !== undefined) {
      const currentCenter = map.getCenter()
      map.setMaxBounds(maxBounds)
      if (maxBounds.contains(currentCenter)) {
        // do nothing... the current center is part of the maximum boundary of the crs system
      } else {
        // current center is not part of the boundary of the crs system. We need to center the map new
        map?.fitBounds(maxBounds)
      }

      // map?.setMaxBounds(maxBounds)
    }
  }, [map, maxBounds])

  useEffect(() => {
    if (crsIntersection.length > 0 && _selectedCrs === undefined) {
      const defaultCrs = crsIntersection.find(crs => crs.stringRepresentation === 'EPSG:4326') ?? crsIntersection[0]
      setSelectedCrs(defaultCrs)
    }
  }, [crsIntersection, _selectedCrs])

  const value = useMemo<MapViewerContextType>(() => {
    return {
      tiles: editor ? tiles.concat([editorLayer]) : tiles,
      crsIntersection,
      selectedCrs,
      setSelectedCrs,
      setEditor,
      geoJSON,
      setGeoJSON,
      map,
      setMap,
      owsContext,
      features,
      addWMSByUrl,
      initialFromOwsContext,
      trees,
      activeFeatures,
      setFeatureActive
    }
  }, [
    crsIntersection, 
    editor, 
    editorLayer, 
    geoJSON, 
    map, 
    selectedCrs, 
    tiles,
    owsContext,
    features,
    addWMSByUrl,
    initialFromOwsContext,
    trees,
    activeFeatures,
    setFeatureActive
  ])

  return (
    <context.Provider
      value={value}
    >
      {children}
    </context.Provider>
  )
}

export const useMapViewerContext = (): MapViewerContextType => {
  const ctx = useContext(context)

  if (ctx === undefined) {
    throw new Error('useMapViewerContext must be inside a MapViewerBase')
  }
  return ctx
}
