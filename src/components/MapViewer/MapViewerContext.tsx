import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState, type PropsWithChildren, useEffect, useCallback, useMemo } from 'react'
import { type RaRecord, type Identifier, useDataProvider } from 'react-admin'
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
  moveTree: (treeId: Identifier, newIndex: number) => void
  moveTreeUp: (treeId: Identifier) => void
  moveTreeDown: (treeId: Identifier) => void
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

export const MapViewerBase = ({ children }: PropsWithChildren): ReactNode => {
  const [wmsTrees, setWmsTrees] = useState<WMSTree[]>([])
  const [editor, setEditor] = useState<boolean>(false)
  const [geoJSON, setGeoJSON] = useState<MultiPolygon>()

  const dataProvider = useDataProvider()

  const tiles = useMemo(() => {
    const _tiles: ReactNode[] = []

    const oldWmsTrees = [...wmsTrees].reverse()
    oldWmsTrees.forEach((tree, index) => {
      const checkedLayerIdentifiers = tree.checkedNodes?.sort((a: TreeNode, b: TreeNode) => b.record.mpttLft - a.record.mpttLft).filter(node => Math.floor((node.record?.mpttRgt - node.record?.mpttLft) / 2) === 0).map(node => node.record?.identifier).filter(identifier => !(identifier === null || identifier === undefined))
      const layerIdentifiers = checkedLayerIdentifiers?.join(',') ?? ''
      const getMapUrl: string = tree.record?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url ?? ''

      if (getMapUrl === '') {
        console.warn('missing getmapurl for tree ', tree.id)
      }
      console.log(index, getMapUrl)
      if (layerIdentifiers !== '' && getMapUrl !== '') {
        _tiles.push(

          <WMSTileLayer
            key={(Math.random() + 1).toString(36).substring(7)}
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

    console.log('tiles', _tiles)

    return _tiles
  }, [wmsTrees, editor, geoJSON])

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
              'fields[Layer]': 'title,mptt_lft,mptt_rgt,mptt_depth,referemce_systems,service,is_spatial_secured,_is_secured,identifier'
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
