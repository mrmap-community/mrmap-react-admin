import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState, type PropsWithChildren, useEffect } from 'react'
import { useSidebarState } from 'react-admin'

export interface DrawerState {
  isOpen: boolean
  height: string
  width: string
  marginLeft?: string
}

export interface DrawerContextType {
  rightDrawer: DrawerState
  setRightDrawer: Dispatch<SetStateAction<DrawerState>>
  bottomDrawer: DrawerState
  setBottomDrawer: Dispatch<SetStateAction<DrawerState>>
}

export const DrawerContext = createContext<DrawerContextType | undefined>(undefined)

export const DrawerBase = ({ children }: PropsWithChildren): ReactNode => {
  const [open] = useSidebarState()
  const [lastOpenState, setLastOpenState] = useState<boolean>()

  const [rightDrawer, setRightDrawer] = useState<DrawerState>({ isOpen: false, height: 'calc(100vh - 50px)', width: '20vw' })
  const [bottomDrawer, setBottomDrawer] = useState<DrawerState>({ isOpen: false, height: '30vh', width: '100vw', marginLeft: `${open ? '250px' : '58px'}` })

  useEffect(() => {
    if (lastOpenState === undefined || (open !== lastOpenState)) {
      console.log('huhu')
      setLastOpenState(open)
      setBottomDrawer({ ...bottomDrawer, marginLeft: `${open ? '250px' : '58px'}` })
    }
  }, [open])

  return (
    <DrawerContext.Provider
      value={
        {
          rightDrawer,
          setRightDrawer,
          bottomDrawer,
          setBottomDrawer
        }
      }>
      {children}
    </DrawerContext.Provider>
  )
}

export const useDrawerContext = (): DrawerContextType => {
  const drawerContext = useContext(DrawerContext)
  if (drawerContext === undefined) {
    throw new Error('drawerContext must be inside a DrawerBase')
  }
  return drawerContext
}
