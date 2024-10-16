import { type ReactNode } from 'react';
import { type Identifier, Layout, type LayoutProps } from 'react-admin';

import GitHubIcon from '@mui/icons-material/GitHub';
import { IconButton } from '@mui/material';
import Card from '@mui/material/Card';
import { SnackbarProvider } from 'notistack';

import SnackbarObserver from '../../jsonapi/components/SnackbarObserver';
import TaskShortInfoLive from '../TaskShortInfoLive';
import MrMapAppBar from './AppBar';
import Menu from './Menu';

declare module 'notistack' {
  interface VariantOverrides {
    // adds `taskProgress` variant and specifies the
    // "extra" props it takes in options of `enqueueSnackbar`
    taskProgress: {
      taskId: Identifier
    }
  }
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
      // action={SnackbarCloseButton}
      Components={
        {
          taskProgress: TaskShortInfoLive
        }
      }
    >

      <Layout
        appBar={MrMapAppBar}
        menu={Menu}

        sx={{ marginTop: '0', '& .RaLayout-appFrame': { marginTop: '0 !important' } }}
        {...rest}
      >
        <div style={{ margin: "10px", marginBottom: "20px"}}>
          
          {children}

          
          {<SnackbarObserver />}
        </div>
        <Card style={{
          position: 'fixed', right: 0, bottom: 0, left: 0, zIndex: 100,
          textAlign: 'center',
        }}>
          <IconButton href="https://github.com/mrmap-community" target="_blank">
            <GitHubIcon />
          </IconButton>
        </Card>
      </Layout>
    </SnackbarProvider>

  )
}

export default MyLayout
