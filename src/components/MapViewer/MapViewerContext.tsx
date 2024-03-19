import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState, type PropsWithChildren, useCallback, useMemo, useEffect } from 'react'
import { type RaRecord, type Identifier, useDataProvider } from 'react-admin'
import { ImageOverlay } from 'react-leaflet'
import FeatureGroupEditor from '../FeatureGroupEditor'
import type { MultiPolygon } from 'geojson'
import { getChildren } from '../MapViewer/utils'
import { type Map } from 'leaflet'

export interface MrMapCRS {
  stringRepresentation: string
  code: string
  prefix: string
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
  selectedCrs: string
  setSelectedCrs: (crs: string) => void
  setEditor: Dispatch<SetStateAction<boolean>>
  geoJSON: MultiPolygon | undefined
  setGeoJSON: Dispatch<SetStateAction<MultiPolygon | undefined>>
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

const prepareGetMapUrl = (getMapUrl: string, map: Map, tree: WMSTree, layerIdentifiers: string, crs: string): URL => {
  const size = map.getSize()
  const bounds = map.getBounds()
  const southWest = bounds.getSouthWest()
  const northEast = bounds.getNorthEast()
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
    params.set('BBOX', `${southWest.lat},${southWest.lng},${northEast.lat},${northEast.lng}`)
    if (!(params.has('CRS') || params.has('crs'))) {
      params.append('CRS', crs)
    }
  } else {
    params.set('BBOX', `${southWest.lng},${southWest.lat},${northEast.lng},${northEast.lat}`)
    if (!(params.has('SRS') || params.has('srs'))) {
      params.append('SRS', crs)
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

  const [wmsTrees, setWmsTrees] = useState<WMSTree[]>([])
  const [editor, setEditor] = useState<boolean>(false)
  const [geoJSON, setGeoJSON] = useState<MultiPolygon>()

  const dataProvider = useDataProvider()

  const [invalidateTiles, setInvalidateTiles] = useState(true)

  const crsIntersection = useMemo(() => {
    let referenceSystems: MrMapCRS[] = []
    wmsTrees.map(wms => wms.rootNode?.record.referenceSystems.filter((crs: MrMapCRS) => crs.prefix === 'EPSG').filter((crs: MrMapCRS) => ['3857', '3395', '4326'].includes(crs.code))).forEach((_referenceSystems: MrMapCRS[], index) => {
      if (index === 0) {
        referenceSystems = referenceSystems.concat(_referenceSystems)
      } else {
        referenceSystems = referenceSystems.filter(crsA => _referenceSystems.some(crsB => crsA.stringRepresentation === crsB.stringRepresentation))
      }
    })
    return referenceSystems
  }, [wmsTrees])

  const [selectedCrs, setSelectedCrs] = useState<string>()

  const tiles = useMemo(() => {
    const _tiles: Tile[] = []

    if (map === undefined) {
      return _tiles
    }

    if (invalidateTiles) {
      setInvalidateTiles(false)
    }

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
        const _getMapUrl = prepareGetMapUrl(getMapUrl, map, tree, layerIdentifiers, selectedCrs ?? 'EPSG:4326')

        _tiles.push(
          {
            leafletTile: <ImageOverlay
            key={(Math.random() + 1).toString(36).substring(7)}
            bounds={map.getBounds()}
            interactive={true}
            url={_getMapUrl.href}
          />,
            getMapUrl: _getMapUrl,
            getFeatureinfoUrl: prepareGetFeatureinfoUrl(_getMapUrl, getFeatureinfoUrl, tree, queryableLayerIdentifiers)
          }
        )
      }
    })

    if (editor) {
      _tiles.push({
        leafletTile: <FeatureGroupEditor geoJson={geoJSON} geoJsonCallback={(multiPolygon) => { setGeoJSON(multiPolygon) }} />
      })
    }

    return _tiles
  }, [map, invalidateTiles, wmsTrees, editor, selectedCrs, geoJSON])

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
    map?.addEventListener('moveend', (event) => {
      setInvalidateTiles(true)
    })

    map?.addEventListener('zoomend', (event) => {
      setInvalidateTiles(true)
    })
  }, [map])

  useEffect(() => {
    if (crsIntersection.length > 0 && selectedCrs === undefined) {
      setSelectedCrs(crsIntersection.some(crs => crs.stringRepresentation === 'EPSG:4326') ? 'EPSG:4326' : crsIntersection?.[0]?.stringRepresentation ?? 'EPSG:4326')
    }
  }, [crsIntersection, selectedCrs])

  return (
    <context.Provider
      value={
        {
          tiles,
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
          setMap
        }
      }>
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
