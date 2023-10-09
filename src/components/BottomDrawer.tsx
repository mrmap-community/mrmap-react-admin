import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Drawer, type DrawerProps, IconButton } from '@mui/material'

export interface BottomDrawerProps extends DrawerProps {
  aboveComponentId?: string
  height?: string
  callback?: () => void
}

const BottomDrawer = ({
  aboveComponentId,
  height = '30vh',
  callback = () => { },
  ...rest
}: BottomDrawerProps): ReactNode => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  // adjust padding of map div
  useEffect(() => {
    if (aboveComponentId !== undefined) {
      const div: any = document.querySelector(`#${CSS.escape(aboveComponentId)}`)
      if (!isVisible) {
        div.style.paddingBottom = '0'
      } else {
        div.style.paddingBottom = height
      }
    }
  }, [aboveComponentId, isVisible])

  const toggleVisible = useCallback(() => {
    setIsVisible(!isVisible)
    buttonRef.current?.blur()
    callback()
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
          left: '50%',
          zIndex: 1000,
          padding: 0,
          bottom: `${isVisible ? height : '0px'}`,
          transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
          border: 'unset',
          borderRadius: '5px 5px 0 0',
          width: '60px',
          height: '30px',
          color: 'white',
          backgroundColor: '#002140'
        }
        }

      >
        {isVisible ? <ExpandMore /> : <ExpandLess />}
      </IconButton >
      <Drawer
        anchor="bottom"
        open={isVisible}
        variant="persistent"
        style={{ top: '100px' }}
        sx={
          {
            '& .MuiDrawer-paper': {
              height,
              zIndex: 1001,
              // top: '50px',
              width: '100vw'
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

export default BottomDrawer
