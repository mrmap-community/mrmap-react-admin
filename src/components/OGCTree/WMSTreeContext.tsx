import { createContext, type Dispatch, type ReactNode, type SetStateAction, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { type RaRecord, useShowController } from 'react-admin'
import { type RefetchOptions, type RefetchQueryFilters } from 'react-query'

export interface WMSTreeContextType {
  selectedNodes: RaRecord[]
  setSelectedNodes: (nodes: RaRecord[]) => void
  flatTree: RaRecord[]
  setFlatTree: Dispatch<SetStateAction<RaRecord[]>>
  rawOgcService: RaRecord | undefined
  setRawOgcService: Dispatch<SetStateAction<RaRecord | undefined>>
  refetch: (options?: RefetchOptions & RefetchQueryFilters<unknown>) => Promise<any>
  isLoading: boolean
}

export const WMSTreeContext = createContext<WMSTreeContextType | undefined>(undefined)

export const WMSTreeBase = ({ children }: PropsWithChildren): ReactNode => {
  const [selectedNodes, setSelectedNodes] = useState<RaRecord[]>([])
  const [flatTree, setFlatTree] = useState<RaRecord[]>([])
  const [rawOgcService, setRawOgcService] = useState<RaRecord | undefined>(undefined)

  const {
    isLoading, // boolean that is true until the record is available for the first time
    record, // record fetched via dataProvider.getOne() based on the id from the location
    refetch // callback to refetch the record via dataProvider.getOne()
  } = useShowController({ queryOptions: { meta: { jsonApiParams: { include: 'layers,operationUrls,layers.referenceSystems' } } } })

  const setSelectedNodesSorted = useCallback((nodes: RaRecord[]) => {
    setSelectedNodes(nodes.sort((a: RaRecord, b: RaRecord) => b.lft - a.lft))
  }, [])

  useEffect(() => {
    if (record !== undefined) {
      setFlatTree(record.layers?.sort((a: RaRecord, b: RaRecord) => a.lft - b.lft) ?? [])
      setRawOgcService(record)
    }
  }, [record])

  return (
    <WMSTreeContext.Provider
      value={
        {
          selectedNodes,
          setSelectedNodes: setSelectedNodesSorted,
          flatTree,
          setFlatTree,
          rawOgcService,
          setRawOgcService,
          refetch,
          isLoading
        }
      }>
      {children}
    </WMSTreeContext.Provider>
  )
}

export const useWMSTreeContext = (): WMSTreeContextType => {
  const selectedNodesContext = useContext(WMSTreeContext)
  if (selectedNodesContext === undefined) {
    throw new Error('useWMSTreeContext must be inside a WMSTreeBase')
  }
  return selectedNodesContext
}
