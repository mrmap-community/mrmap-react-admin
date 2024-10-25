import { useRef, useState, type ReactNode } from 'react';
import { Layout, type Identifier, type LayoutProps } from 'react-admin';
import { ReadyState } from 'react-use-websocket';

import CircleIcon from '@mui/icons-material/Circle';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import useResizeObserver from '@react-hook/resize-observer';
import { SnackbarProvider } from 'notistack';

import { useHttpClientContext } from '../../context/HttpClientContext';
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
  const { api, readyState} = useHttpClientContext();
  const footerRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState<number>();
  
  useResizeObserver(footerRef ?? null, (entry) => setFooterHeight(entry.contentRect.height))

  
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
        <div style={{ margin: "10px", marginBottom: footerHeight}}>
          
          {children}

          
          {<SnackbarObserver />}
        </div>
          <Card style={{
            position: 'fixed', 
            right: 0, 
            bottom: 0, 
            left: 0, 
            zIndex: 100,
            textAlign: 'center',
          }}>
            <Grid container spacing={2} sx={{ justifyContent: 'space-between' }} ref={footerRef}>
            
              <Grid item>
              <Typography padding={1}> v.{api?.document.info.version}</Typography>
              </Grid>

              <Grid item >
                <IconButton href="https://github.com/mrmap-community" target="_blank">
                  <GitHubIcon />
                </IconButton>
              </Grid>

              <Grid item alignItems="center" >
                <Tooltip title={readyState === ReadyState.OPEN ? 'Backend is connected': 'Connection to backend lost'}>
                  <IconButton padding={1} >
                    <CircleIcon
                      color={readyState === ReadyState.OPEN ? 'success': 'error'}
                    />
                  </IconButton>
                </Tooltip>
              </Grid>
            
            </Grid>
          </Card>
       
      </Layout>
    </SnackbarProvider>

  )
}

export default MyLayout
