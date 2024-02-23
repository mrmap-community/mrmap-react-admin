import { type ReactElement, useContext, useMemo } from 'react'
import {
  Admin,
  CustomRoutes,
  defaultTheme, Loading,
  useStore,
  type RaThemeOptions
} from 'react-admin'
import { Route } from 'react-router-dom'

import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt'
import LayersIcon from '@mui/icons-material/Layers'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import MapIcon from '@mui/icons-material/Map'

import { HttpClientContext } from '../context/HttpClientContext'
import ResourceGuesser from '../jsonapi/components/ResourceGuesser'
import authProvider from '../providers/authProvider'
import jsonApidataProvider from '../providers/dataProvider'
import MyLayout from './Layout'
import WmsList from './WMS/WmsList'
import WmsViewer from './WMS/WmsViewer'

export const TOKENNAME = 'token'

export interface Token {
  token: string
  expiry: string
}

const MrMapFrontend = (): ReactElement => {
  const lightTheme = defaultTheme
  const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } }

  const { client, isLoading } = useContext(HttpClientContext)

  const [token, setToken] = useStore<string>(TOKENNAME, undefined)

  const parsedToken: Token = useMemo(() => {
    return (token !== undefined) ? JSON.parse(token) : undefined
  }, [token])

  if (isLoading || client === undefined) {
    return (
      <Loading loadingPrimary="OpenApi Client is loading...." loadingSecondary='OpenApi Client is loading....' />
    )
  } else {
    const asyncClient = client.api.getClient()
    const jsonApiDataProvider = jsonApidataProvider({
      entrypoint: 'http://localhost:8001/',
      httpClient: asyncClient,
      realtimeBus: 'ws://localhost:8001/ws/default/',
      user: {
        token: parsedToken?.token
      }
    })

    return (
      <Admin
        theme={lightTheme}
        darkTheme={darkTheme}
        dataProvider={jsonApiDataProvider}
        authProvider={authProvider({ token, tokenSetter: setToken })}
        layout={MyLayout}
      >
        <ResourceGuesser name={'WebMapService'} list={<WmsList />} icon={MapIcon} >
          <Route path=":id/viewer" element={<WmsViewer />} />
        </ResourceGuesser>
        <ResourceGuesser name={'HistoricalWebMapService'} />

        <ResourceGuesser name={'Layer'} icon={LayersIcon} />
        <ResourceGuesser name={'WebFeatureService'} />
        <ResourceGuesser name={'FeatureType'} icon={AddLocationAltIcon} />
        <ResourceGuesser name={'Keyword'} icon={LocalOfferIcon} />
        <ResourceGuesser name={'BackgroundProcess'} />
        <ResourceGuesser name={'DatasetMetadata'} />
        <ResourceGuesser name={'AllowedWebMapServiceOperation'} />

        <CustomRoutes>
          <Route path="/viewer" element={<WmsViewer />} />

        </CustomRoutes>
      </Admin>
    )
  }
}

export default MrMapFrontend
