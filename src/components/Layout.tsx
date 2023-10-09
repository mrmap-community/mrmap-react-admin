import { type ReactNode } from 'react'
import { type Identifier, Layout, type LayoutProps } from 'react-admin'
import { AppBar } from 'react-admin'

import { SnackbarProvider } from 'notistack'

import SnackbarObserver from '../jsonapi/components/SnackbarObserver'
import TaskShortInfoLive from './TaskShortInfoLive'
declare module 'notistack' {
  interface VariantOverrides {
    // adds `taskProgress` variant and specifies the
    // "extra" props it takes in options of `enqueueSnackbar`
    taskProgress: {
      taskId: Identifier
    }
  }
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
