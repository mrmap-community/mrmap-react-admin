import { createContext, type Dispatch, type ReactNode, type SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { type RaRecord, useShowController } from 'react-admin'
import { type RefetchOptions, type RefetchQueryFilters } from 'react-query'

export interface TreeContextType {
  selectedNodes: RaRecord[]
  setSelectedNodes: (nodes: RaRecord[]) => void
  flatTree: RaRecord[]
  setFlatTree: Dispatch<SetStateAction<RaRecord[]>>
  rawOgcService: RaRecord | undefined
  setRawOgcService: Dispatch<SetStateAction<RaRecord | undefined>>
  refetch: (options?: RefetchOptions & RefetchQueryFilters<unknown>) => void
  isLoading: boolean
}

export const TreeContext = createContext<TreeContextType | undefined>(undefined)

export const TreeBase = ({ children }): ReactNode => {
  const [selectedNodes, setSelectedNodes] = useState<RaRecord[]>([])
  const [flatTree, setFlatTree] = useState<RaRecord[]>([])
  const [rawOgcService, setRawOgcService] = useState<RaRecord | undefined>(undefined)

  const {
    isLoading, // boolean that is true until the record is available for the first time
    record, // record fetched via dataProvider.getOne() based on the id from the location
    refetch // callback to refetch the record via dataProvider.getOne()
  } = useShowController({ queryOptions: { meta: { jsonApiParams: { include: 'layers,operationUrls,layers.referenceSystems' } } } })

  const setSelectedNodesSorted = useCallback((nodes: RaRecord[]) => {
    setSelectedNodes(nodes.toSorted((a: RaRecord, b: RaRecord) => b.lft - a.lft))
  }, [])

  useEffect(() => {
    if (record !== undefined) {
      setFlatTree(record.layers?.sort((a: RaRecord, b: RaRecord) => a.lft - b.lft) ?? [])
      setRawOgcService(record)
    }
  }, [record])

  return (
    <TreeContext.Provider
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
    </TreeContext.Provider>
  )
}

export const useTreeContext = (): TreeContextType => {
  const selectedNodesContext = useContext(TreeContext)
  if (selectedNodesContext === undefined) {
    throw new Error('selectedNodesContext must be inside a TreeBase')
  }
  return selectedNodesContext
}
