import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { Drawer, type DrawerProps, IconButton } from '@mui/material'

export interface RightDrawerProps extends DrawerProps {
  leftComponentId?: string
  width?: string
}

const RightDrawer = ({
  leftComponentId,
  width = '20vw',
  ...rest
}: RightDrawerProps): ReactNode => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  // adjust padding of map div
  useEffect(() => {
    if (leftComponentId !== undefined) {
      const div: any = document.querySelector(`#${CSS.escape(leftComponentId)}`)
      if (!isVisible) {
        div.style.paddingRight = '0'
      } else {
        div.style.paddingRight = width
      }
    }
  }, [leftComponentId, isVisible])

  const toggleVisible = useCallback(() => {
    setIsVisible(!isVisible)
    buttonRef.current?.blur()
  }, [isVisible, buttonRef])

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
          top: '50%',
          zIndex: 1000,
          padding: 0,
          right: `${isVisible ? width : '0px'}`,
          transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)'

        }
        }

      >
        {isVisible ? <ChevronRight /> : <ChevronLeft />}
      </IconButton >
      <Drawer
        anchor="right"
        open={isVisible}
        variant="persistent"
        style={{ top: '100px' }}
        sx={
          {
            '& .MuiDrawer-paper': {
              width,
              zIndex: 1,
              top: '50px',
              height: 'calc(100vh - 50px)'
              // padding: `${theme.spacing(0, 1)}`,
              // justifyContent: 'flex-start'
            }
          }
        }
        {...rest}
      >

      </Drawer >
    </>
  )
}

export default RightDrawer
