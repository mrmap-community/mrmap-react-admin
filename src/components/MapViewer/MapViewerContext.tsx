import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState, type PropsWithChildren, useEffect, useCallback } from 'react'
import { type RaRecord, type Identifier, useDataProvider, useGetOne, type UseGetOneHookValue } from 'react-admin'
import { WMSTileLayer } from 'react-leaflet'
import FeatureGroupEditor from '../FeatureGroupEditor'
import type { MultiPolygon } from 'geojson'
import { getChildren } from '../MapViewer/utils'

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

export interface MapViewerContextType {
  tiles: ReactNode[]
  wmsTrees: WMSTree[]
  setWmsTrees: Dispatch<SetStateAction<WMSTree[]>>
  removeWmsTree: (wmsId: Identifier) => void
  updateOrAppendWmsTree: (wmsTree: WMSTree) => void
  setEditor: Dispatch<SetStateAction<boolean>>
  geoJSON: MultiPolygon | undefined
  setGeoJSON: Dispatch<SetStateAction<MultiPolygon | undefined>>
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

export const useGetWms = (id: Identifier): void => {
  const { data, isLoading, error, refetc } = useGetOne(
    'WebMapService',
    {
      id,
      meta: {
        jsonApiParams: {
          include: 'layers,operationUrls,layers.referenceSystems',
          'fields[Layer]': 'title,mptt_lft,mptt_rgt,mptt_depth,referemce_systems,service,is_spatial_secured,_is_secured,identifier'
        }
      }
    }
  )

  const { updateOrAppendWmsTree } = useMapViewerContext()

  useEffect(() => {
    if (data !== undefined) {
      const wmsTree = raRecordToTopDownTree(data)
      updateOrAppendWmsTree(wmsTree)
    }
  }, [data])
}

export const MapViewerBase = ({ children }: PropsWithChildren): ReactNode => {
  const [wmsTrees, setWmsTrees] = useState<WMSTree[]>([])
  const [tiles, setTiles] = useState<ReactNode[]>([])
  const [editor, setEditor] = useState<boolean>(false)
  const [geoJSON, setGeoJSON] = useState<MultiPolygon>()

  const dataProvider = useDataProvider()

  useEffect(() => {
    const _tiles: ReactNode[] = []

    wmsTrees.forEach(tree => {
      const checkedLayerIdentifiers = tree.checkedNodes?.sort((a: TreeNode, b: TreeNode) => b.record.mpttLft - a.record.mpttLft).filter(node => Math.floor((node.record?.mpttRgt - node.record?.mpttLft) / 2) === 0).map(node => node.record?.identifier).filter(identifier => !(identifier === null || identifier === undefined))
      const layerIdentifiers = checkedLayerIdentifiers?.join(',') ?? ''
      const getMapUrl: string = tree.record?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url ?? ''

      if (getMapUrl === '') {
        console.warn('missing getmapurl for tree ', tree.id)
      }

      if (layerIdentifiers !== '' && getMapUrl !== '') {
        _tiles.push(<WMSTileLayer
          url={getMapUrl}
          params={
            { layers: layerIdentifiers }
          }
          version={tree.record?.version === '' ? '1.3.0' : tree.record?.version}
          transparent={true}
          zoomOffset={-1}
          format='image/png'
          noWrap
        />)
      }
    })

    if (editor) {
      _tiles.push(<FeatureGroupEditor geoJson={geoJSON} geoJsonCallback={(multiPolygon) => { setGeoJSON(multiPolygon) }} />)
    }

    setTiles(_tiles)
  }, [wmsTrees, editor, geoJSON])

  useEffect(() => {
    console.log('changed: ', wmsTrees)
  }, [wmsTrees])

  const removeWmsTree = useCallback((treeId: Identifier) => {
    const newTrees = wmsTrees.filter(tree => tree.id !== treeId)
    setWmsTrees(newTrees)
  }, [wmsTrees])

  const updateOrAppendWmsTree = useCallback((newTree: WMSTree) => {
    console.log(newTree, wmsTrees)
    const index = wmsTrees.findIndex(tree => tree.id === newTree.id)
    if (index === -1) {
      dataProvider.getOne(
        'WebMapService',
        {
          id: newTree.id,
          meta: {
            jsonApiParams: {
              include: 'layers,operationUrls,layers.referenceSystems',
              'fields[Layer]': 'title,mptt_lft,mptt_rgt,mptt_depth,referemce_systems,service,is_spatial_secured,_is_secured,identifier'
            }
          }
        }
      ).then(({ data }) => {
        setWmsTrees(prevWmsTrees => [...prevWmsTrees, raRecordToTopDownTree(data)])
      }).catch(error => {
        console.error('something went wrong while loading wms tree', error)
      })
    } else if (index >= 0) {
      setWmsTrees(prevWmsTrees => {
        const updatedWmsTrees = [...prevWmsTrees]
        updatedWmsTrees[index] = newTree
        return updatedWmsTrees
      })
    }
  }, [wmsTrees, dataProvider])

  return (
    <context.Provider
      value={
        {
          tiles,
          wmsTrees,
          setWmsTrees,
          removeWmsTree,
          updateOrAppendWmsTree,
          setEditor,
          geoJSON,
          setGeoJSON
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
