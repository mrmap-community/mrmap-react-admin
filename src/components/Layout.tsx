import { useLayoutEffect, type ReactNode, useRef, useState, useEffect } from 'react'
import { type Identifier, Layout, type LayoutProps, Menu } from 'react-admin'
import { AppBar } from 'react-admin'

import { SnackbarProvider } from 'notistack'

import SnackbarObserver from '../jsonapi/components/SnackbarObserver'
import TaskShortInfoLive from './TaskShortInfoLive'
import useResizeObserver from '@react-hook/resize-observer'
declare module 'notistack' {
  interface VariantOverrides {
    // adds `taskProgress` variant and specifies the
    // "extra" props it takes in options of `enqueueSnackbar`
    taskProgress: {
      taskId: Identifier
    }
  }
}
const MyMenu = (): ReactNode => {
  const target = useRef(null)

  const [size, setSize] = useState<DOMRectReadOnly>()
  const [isOpen, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    console.log(isOpen)
  }, [isOpen])

  useEffect(() => {
    if ((size?.width ?? 50) <= 50) { // TODO: is the menu min width configured elswere? If so, get it from the configuration
      if (isOpen) {
        setIsOpen(false)
      }
    } else if ((size?.width ?? 50) >= 240) { // TODO: is the menu max width configured elswere? If so, get it from the configuration
      if (!isOpen) {
        setIsOpen(true)
      }
    }
  }, [isOpen, size])

  useLayoutEffect(() => {
    if (target.current !== null) {
      setSize(target.current.getBoundingClientRect())
    }
  }, [target])

  // Where the magic happens
  useResizeObserver(target, (entry) => { setSize(entry.contentRect) })

  return (
    <div ref={target}>
    <Menu/>
    </div>
  )
}

const MyAppBar = (): ReactNode => <AppBar position="sticky" />

// Dirty hack to append SnackbarObserver
const MyLayout = (
  {
    children,
    ...rest
  }: LayoutProps
): ReactNode => {
  return (
    <SnackbarProvider
      maxSnack={10}
      // action={SnackbarCloseButton}
      Components={
        {
          taskProgress: TaskShortInfoLive
        }
      }
    >

      <Layout
        appBar={MyAppBar}
        sx={{ marginTop: '0', '& .RaLayout-appFrame': { marginTop: '0 !important' } }}
        {...rest}
        menu={MyMenu}

      >
        <div>
          {children}
          {<SnackbarObserver />}
        </div>
      </Layout>
    </SnackbarProvider>

  )
}

export default MyLayout
