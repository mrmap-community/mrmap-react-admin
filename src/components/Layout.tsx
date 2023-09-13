import { type ReactNode } from 'react'
import { Layout, type LayoutProps } from 'react-admin'

import IconClose from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'
import { SnackbarProvider } from 'notistack'
import { type SnackbarKey, useSnackbar } from 'notistack'

import SnackbarObserver from '../jsonapi/components/SnackbarObserver'

const SnackbarCloseButton = (snackbarKey: SnackbarKey): ReactNode => {
  const { closeSnackbar } = useSnackbar()

  return (
    <IconButton onClick={() => { closeSnackbar(snackbarKey) }}>
      <IconClose />
    </IconButton>
  )
}

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
      action={SnackbarCloseButton}

    >

      <Layout {...rest} >

        <div>{children}{<SnackbarObserver />}</div>
      </Layout>
    </SnackbarProvider>

  )
}

export default MyLayout
