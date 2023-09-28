import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState } from 'react'
import { type RaRecord } from 'react-admin'

export interface TreeContextType {
  selectedNodes: RaRecord[]
  setSelectedNodes: Dispatch<SetStateAction<RaRecord[]>>
  flatTree: RaRecord[]
  setFlatTree: Dispatch<SetStateAction<RaRecord[]>>

}

export const TreeContext = createContext<TreeContextType | undefined>(undefined)

export const TreeBase = ({ children }): ReactNode => {
  const [selectedNodes, setSelectedNodes] = useState<RaRecord[]>([])
  const [flatTree, setFlatTree] = useState<RaRecord[]>([])
  return (
    <TreeContext.Provider value={{ selectedNodes, setSelectedNodes, flatTree, setFlatTree }}>
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
