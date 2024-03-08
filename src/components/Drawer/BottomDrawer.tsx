import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Drawer, type DrawerProps, IconButton } from '@mui/material'
import { type DrawerState, useDrawerContext } from './DrawerContext'

export interface BottomDrawerProps extends DrawerProps {
  aboveComponentId?: string
  height?: string
  callback?: () => void
}

const BottomDrawer = ({
  aboveComponentId,
  callback = () => { },
  children,
  ...rest
}: BottomDrawerProps): ReactNode => {
  const target = useRef(null)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const { bottomDrawer, setBottomDrawer, rightDrawer, setRightDrawer } = useDrawerContext()
  const [lastRightDrawerState, setLastRightDrawerState] = useState<DrawerState>(rightDrawer)
  const childComponent = useMemo(() => {
    if (bottomDrawer.children !== undefined) {
      return bottomDrawer.children
    }
    return children
  }, [bottomDrawer, children])

  // adjust padding of map div
  useEffect(() => {
    if (aboveComponentId !== undefined) {
      const div: any = document.querySelector(`#${CSS.escape(aboveComponentId)}`)
      if (!bottomDrawer.isOpen) {
        div.style.paddingBottom = '0'
      } else {
        div.style.paddingBottom = bottomDrawer.height
      }
    }

    if (bottomDrawer.isOpen) {
      setLastRightDrawerState(rightDrawer)
      setRightDrawer({ ...rightDrawer, height: `calc(100vh - 50px - ${bottomDrawer.height})` })
    } else {
      setRightDrawer({ ...rightDrawer, height: lastRightDrawerState?.height })
    }
  }, [aboveComponentId, bottomDrawer.isOpen])

  const toggleVisible = useCallback(() => {
    setBottomDrawer({ ...bottomDrawer, isOpen: !bottomDrawer.isOpen })
    buttonRef.current?.blur()
    callback()
  }, [bottomDrawer, buttonRef])

  return (
    <>
      <IconButton
        ref={buttonRef}
        color={'inherit'}
        edge="start"
        // className={`rules-drawer-toggle-button ${isVisible ? 'expanded' : 'collapsed'}`}
        onClick={toggleVisible}
        sx={{
          position: 'absolute',
          left: '50%',
          zIndex: 1000,
          padding: 0,
          bottom: `${bottomDrawer.isOpen ? bottomDrawer.height : '0px'}`,
          transition: 'all 225 cubic-bezier(0.4, 0, 0.6, 1) 0ms !important',
          border: 'unset',
          borderRadius: '5px 5px 0 0',
          width: '60px',
          height: '30px',
          color: 'white',
          backgroundColor: '#002140'
        }
        }

      >
        {bottomDrawer.isOpen ? <ExpandMore /> : <ExpandLess />}
      </IconButton >

      <Drawer

        anchor="bottom"
        open={bottomDrawer.isOpen}
        variant="persistent"
        style={{ top: '100px' }}
        sx={{
          '& .MuiDrawer-paper': {
            height: bottomDrawer.height,
            zIndex: 1001,
            width: bottomDrawer.width,
            marginLeft: bottomDrawer.marginLeft,
            transition: 'all 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms !important;'
          }
        }}
        {...rest}
      >

                  {childComponent}
      </Drawer>
    </>
  )
}

export default BottomDrawer
