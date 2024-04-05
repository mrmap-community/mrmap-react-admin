import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState, type PropsWithChildren, useCallback, useMemo, useEffect, useRef } from 'react'
import { type RaRecord, type Identifier, useDataProvider, useGetOne } from 'react-admin'
import { ImageOverlay } from 'react-leaflet'
import FeatureGroupEditor from '../FeatureGroupEditor'
import type { MultiPolygon, GeoJSON } from 'geojson'
import { getChildren } from '../MapViewer/utils'
import { type LatLngBounds, type Map } from 'leaflet'
import proj4 from 'proj4'
import L from 'leaflet'

export interface MrMapCRS extends RaRecord {
  stringRepresentation: string
  code: string
  prefix: string
  wkt?: string
  bbox?: GeoJSON
  isYxOrder: boolean
  isXyOrder: boolean
}

export interface TreeNode {
  id: Identifier
  name: string
  children: TreeNode[]
  record: RaRecord
}

export interface WMSTree {
  id: Identifier
  rootNode?: TreeNode
  record?: RaRecord
  checkedNodes?: TreeNode[]
}

export interface Tile {
  leafletTile: ReactNode
  getMapUrl?: URL
  getFeatureinfoUrl?: URL
}

export interface MapViewerContextType {
  tiles: Tile[]
  wmsTrees: WMSTree[]
  setWmsTrees: Dispatch<SetStateAction<WMSTree[]>>
  removeWmsTree: (wmsId: Identifier) => void
  updateOrAppendWmsTree: (wmsTree: WMSTree) => void
  moveTree: (treeId: Identifier, newIndex: number) => void
  moveTreeUp: (treeId: Identifier) => void
  moveTreeDown: (treeId: Identifier) => void
  crsIntersection: MrMapCRS[]
  selectedCrs: MrMapCRS
  setSelectedCrs: (crs: MrMapCRS) => void
  setEditor: Dispatch<SetStateAction<boolean>>
  geoJSON: MultiPolygon | undefined
  setGeoJSON: Dispatch<SetStateAction<MultiPolygon | undefined>>
  map?: Map
  setMap: Dispatch<SetStateAction<Map>>
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

const prepareGetMapUrl = (getMapUrl: string, size: L.Point, bounds: LatLngBounds, tree: WMSTree, layerIdentifiers: string, crs: MrMapCRS): URL => {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  let swLatLng = [sw.lat, sw.lng]
  let neLatLng = [ne.lat, ne.lng]

  if (crs.stringRepresentation !== 'EPSG:4326') {
    const proj = proj4('EPSG:4326', crs.wkt)
    swLatLng = proj.forward(swLatLng)
    neLatLng = proj.forward(neLatLng)

    const latLngs = swLatLng.concat(neLatLng)
    const invalidValues = latLngs.some(Number.isNaN)

    if (invalidValues) {
      // map.zoomIn()
    }
  }

  const version = tree.record?.version === '' ? '1.3.0' : tree.record?.version

  const url = new URL(getMapUrl)
  const params = url.searchParams

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
      params.set('BBOX', `${swLatLng[1]},${swLatLng[0]},${neLatLng[1]},${neLatLng[0]}`)
    } else {
      params.set('BBOX', `${swLatLng[0]},${swLatLng[1]},${neLatLng[0]},${neLatLng[1]}`)
    }
    if (!(params.has('CRS') || params.has('crs'))) {
      params.append('CRS', crs.stringRepresentation)
    }
  } else {
    // always minx,miny,maxx,maxy (minLng,minLat,maxLng,maxLat)
    params.set('BBOX', `${swLatLng[1]},${swLatLng[0]},${neLatLng[1]},${neLatLng[0]}`)
    if (!(params.has('SRS') || params.has('srs'))) {
      params.append('SRS', crs.stringRepresentation)
    }
  }

  params.set('WIDTH', size.x.toString())
  params.set('HEIGHT', size.y.toString())
  params.set('LAYERS', layerIdentifiers)

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

export const MapViewerBase = ({ children }: PropsWithChildren): ReactNode => {
  const [map, setMap] = useState<Map>()
  const [mapBounds, setMapBounds] = useState(map?.getBounds())
  const [mapSize, setMapSize] = useState(map?.getSize())

  const [wmsTrees, setWmsTrees] = useState<WMSTree[]>([])
  const [editor, setEditor] = useState<boolean>(false)
  const [geoJSON, setGeoJSON] = useState<MultiPolygon>()
  const [maxBounds, setMaxBounds] = useState<LatLngBounds>()

  const dataProvider = useDataProvider()

  const [_selectedCrs, setSelectedCrs] = useState<MrMapCRS>()

  const { data: selectedCrs, isLoading, error, refetch } = useGetOne(
    'ReferenceSystem',
    { id: _selectedCrs?.id }
  )

  const crsIntersection = useMemo(() => {
    let referenceSystems: MrMapCRS[] = []
    wmsTrees.map(wms => wms.rootNode?.record.referenceSystems.filter((crs: MrMapCRS) => crs.prefix === 'EPSG')).forEach((_referenceSystems: MrMapCRS[], index) => {
      if (index === 0) {
        referenceSystems = referenceSystems.concat(_referenceSystems)
      } else {
        referenceSystems = referenceSystems.filter(crsA => _referenceSystems.some(crsB => crsA.stringRepresentation === crsB.stringRepresentation))
      }
    })
    return referenceSystems
  }, [wmsTrees])

  const tiles = useMemo(() => {
    const _tiles: Tile[] = []

    if (mapBounds === undefined || mapSize === undefined) {
      console.log('huhu')
      return _tiles
    }

    console.log('calc tiles new')

    const oldWmsTrees = [...wmsTrees].reverse()
    oldWmsTrees.forEach((tree, index) => {
      const checkedLayers = tree.checkedNodes?.sort((a: TreeNode, b: TreeNode) => b.record.mpttLft - a.record.mpttLft).filter(node => Math.floor((node.record?.mpttRgt - node.record?.mpttLft) / 2) === 0)
      const checkedLayerIdentifiers = checkedLayers?.map(node => node.record?.identifier).filter(identifier => !(identifier === null || identifier === undefined))
      const layerIdentifiers = checkedLayerIdentifiers?.join(',') ?? ''
      const getMapUrl: string = tree.record?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url ?? ''

      const queryableLayers = checkedLayers?.filter(node => node.record.isQueryable)
      const queryableLayerIdentifiers = queryableLayers?.map(node => node.record?.identifier).filter(identifier => !(identifier === null || identifier === undefined)) ?? []

      const getFeatureinfoUrl: string = tree.record?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetFeatureInfo' && operationUrl.method === 'Get')?.url ?? ''

      if (getMapUrl === '') {
        console.warn('missing getmapurl for tree ', tree.id)
      }

      if (layerIdentifiers !== '' && getMapUrl !== '') {
        const _getMapUrl = prepareGetMapUrl(getMapUrl, mapSize, mapBounds, tree, layerIdentifiers, selectedCrs ?? { stringRepresentation: 'EPSG:4326' })

        _tiles.push(
          {
            leafletTile: <ImageOverlay
            key={(Math.random() + 1).toString(36).substring(7)}
            bounds={mapBounds}
            interactive={true}
            url={_getMapUrl.href}
          />,
            getMapUrl: _getMapUrl,
            getFeatureinfoUrl: prepareGetFeatureinfoUrl(_getMapUrl, getFeatureinfoUrl, tree, queryableLayerIdentifiers)
          }
        )
      }
    })

    return _tiles
  }, [mapBounds, mapSize, wmsTrees, selectedCrs])

  const editorLayer = useMemo(() => {
    return {
      leafletTile: <FeatureGroupEditor
        geoJson={geoJSON}
        geoJsonCallback={(multiPolygon) => { setGeoJSON(multiPolygon) }}
        />
    }
  }, [geoJSON])

  const removeWmsTree = useCallback((treeId: Identifier) => {
    setWmsTrees(prevWmsTrees => prevWmsTrees.filter(tree => tree.id !== treeId))
  }, [])

  const updateOrAppendWmsTree = useCallback((newTree: WMSTree) => {
    const index = wmsTrees.findIndex(tree => tree.id === newTree.id)
    if (index < 0) {
      dataProvider.getOne(
        'WebMapService',
        {
          id: newTree.id,
          meta: {
            jsonApiParams: {
              include: 'layers,operationUrls,layers.referenceSystems',
              'fields[Layer]': 'title,mptt_lft,mptt_rgt,mptt_depth,reference_systems,service,is_spatial_secured,_is_secured,identifier,is_queryable,bbox_lat_lon'
            }
          }
        }
      ).then(({ data }) => {
        setWmsTrees(prevWmsTrees => [...prevWmsTrees, raRecordToTopDownTree(data)])
      }).catch(error => {
        console.error('something went wrong while loading wms tree', error)
      })
    } else {
      setWmsTrees(prevWmsTrees => {
        const updatedWmsTrees = [...prevWmsTrees]
        updatedWmsTrees[index] = newTree
        return updatedWmsTrees
      })
    }
  }, [wmsTrees, dataProvider])

  const moveTree = useCallback((treeId: Identifier, newIndex: number) => {
    setWmsTrees(prevWmsTrees => {
      const currentIndex = prevWmsTrees.findIndex(tree => tree.id === treeId)

      if (newIndex >= prevWmsTrees.length) {
        newIndex = prevWmsTrees.length - 1
      }

      const newTrees = [...prevWmsTrees]
      newTrees.splice(newIndex, 0, newTrees.splice(currentIndex, 1)[0])
      return newTrees
    })
  }, [])

  const moveTreeUp = useCallback((treeId: Identifier) => {
    const currentIndex = wmsTrees.findIndex(tree => tree.id === treeId)
    if (currentIndex !== 0) {
      moveTree(treeId, currentIndex - 1)
    }
  }, [moveTree, wmsTrees])

  const moveTreeDown = useCallback((treeId: Identifier) => {
    const currentIndex = wmsTrees.findIndex(tree => tree.id === treeId)
    if (currentIndex !== wmsTrees.length - 1) {
      moveTree(treeId, currentIndex + 1)
    }
  }, [moveTree, wmsTrees])

  useEffect(() => {
    map?.addEventListener('resize moveend zoomend', (event) => {
      setMapBounds(map.getBounds())
      setMapSize(map.getSize())
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
    console.log(maxBounds)
    if (maxBounds !== undefined && map !== undefined) {
      const currentCenter = map.getCenter()
      map.setMaxBounds(maxBounds)
      if (maxBounds.contains(currentCenter)) {
        console.log('nui')

        // do nothing... the current center is part of the maximum boundary of the crs system
      } else {
        // current center is not part of the boundary of the crs system. We need to center the map new
        console.log('hui')
        // map?.panTo(maxBounds.getCenter())
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
      wmsTrees,
      setWmsTrees,
      removeWmsTree,
      updateOrAppendWmsTree,
      moveTree,
      moveTreeUp,
      moveTreeDown,
      crsIntersection,
      selectedCrs,
      setSelectedCrs,
      setEditor,
      geoJSON,
      setGeoJSON,
      map,
      setMap
    }
  }, [crsIntersection, editor, editorLayer, geoJSON, map, moveTree, moveTreeDown, moveTreeUp, removeWmsTree, selectedCrs, tiles, updateOrAppendWmsTree, wmsTrees])

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
