import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState, type PropsWithChildren, useEffect } from 'react'
import { type RaRecord, type Identifier } from 'react-admin'
import { WMSTileLayer } from 'react-leaflet'

export interface TreeNode {
  id: Identifier
  name: string
  children: TreeNode[]
  record: RaRecord
}

export interface WMSTree {
  id: Identifier
  rootNode: TreeNode
  record: RaRecord
  checkedNodes: TreeNode[]
}

export interface MapViewerContextType {
  tiles: ReactNode[]
  wmsTrees: WMSTree[]
  setWmsTrees: Dispatch<SetStateAction<WMSTree[]>>

}

export const context = createContext<MapViewerContextType | undefined>(undefined)

export const MapViewerBase = ({ children }: PropsWithChildren): ReactNode => {
  const [wmsTrees, setWmsTrees] = useState<WMSTree[]>([])
  const [tiles, setTiles] = useState<ReactNode[]>([])

  useEffect(() => {
    const _tiles: ReactNode[] = []
    wmsTrees.forEach(tree => {
      const checkedLayerIdentifiers = tree.checkedNodes.sort((a: TreeNode, b: TreeNode) => b.record.lft - a.record.lft).filter(node => Math.floor((node.record?.rght - node.record?.lft) / 2) === 0).map(node => node.record?.identifier).filter(identifier => !(identifier === null || identifier === undefined))
      const layerIdentifiers = checkedLayerIdentifiers.join(',') ?? ''
      const getMapUrl: string = tree.record?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url ?? ''

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
    setTiles(_tiles)
  }, [wmsTrees])

  return (
    <context.Provider
      value={
        {
          tiles,
          wmsTrees,
          setWmsTrees
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
