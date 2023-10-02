import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useEffect, useState } from 'react'
import { type RaRecord, useResourceDefinition, useShowController } from 'react-admin'
import { type RefetchOptions, type RefetchQueryFilters } from 'react-query'

export interface TreeContextType {
  selectedNodes: RaRecord[]
  setSelectedNodes: Dispatch<SetStateAction<RaRecord[]>>
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
    defaultTitle, // the translated title based on the resource, e.g. 'Post #123'
    error, // error returned by dataProvider when it failed to fetch the record. Useful if you want to adapt the view instead of just showing a notification using the `onError` side effect.
    isFetching, // boolean that is true while the record is being fetched, and false once the record is fetched
    isLoading, // boolean that is true until the record is available for the first time
    record, // record fetched via dataProvider.getOne() based on the id from the location
    refetch, // callback to refetch the record via dataProvider.getOne()
    resource // the resource name, deduced from the location. e.g. 'posts'
  } = useShowController({ queryOptions: { meta: { jsonApiParams: { include: 'layers,operationUrls' } } } })

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
          setSelectedNodes,
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
