import { type ReactElement, useContext } from 'react'
import {
  Admin,
  defaultTheme, Loading,
  type RaThemeOptions
} from 'react-admin'

import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt'
import LayersIcon from '@mui/icons-material/Layers'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import MapIcon from '@mui/icons-material/Map'

import { HttpClientContext } from '../context/HttpClientContext'
import ResourceGuesser from '../jsonapi/components/ResourceGuesser'
import authProvider from '../providers/authProvider'
import jsonApidataProvider from '../providers/dataProvider'
import WmsList from './WmsList'
const MrMapFrontend = (): ReactElement => {
  const lightTheme = defaultTheme
  const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } }

  const { client, isLoading } = useContext(HttpClientContext)

  if (isLoading || client === undefined) {
    return (
      <Loading loadingPrimary="OpenApi Client is loading...." loadingSecondary='OpenApi Client is loading....' />
    )
  } else {
    const asyncClient = client.api.getClient()
    const jsonApiDataProvider = jsonApidataProvider({
      entrypoint: 'https://mrmap.geospatial-interoperability-solutions.eu/',
      httpClient: asyncClient,
      realtimeBus: 'wss://mrmap.geospatial-interoperability-solutions.eu/ws/default/'
    })

    return (
      <Admin
        theme={lightTheme}
        darkTheme={darkTheme}
        dataProvider={jsonApiDataProvider}
        authProvider={authProvider()}
      >
        <ResourceGuesser name={'WebMapService'} list={<WmsList />} icon={MapIcon} />
        <ResourceGuesser name={'Layer'} icon={LayersIcon} />
        <ResourceGuesser name={'WebFeatureService'} />
        <ResourceGuesser name={'FeatureType'} icon={AddLocationAltIcon} />
        <ResourceGuesser name={'Keyword'} icon={LocalOfferIcon} />
        <ResourceGuesser name={'BackgroundProcess'} />

      </Admin>
    )
  }
}

export default MrMapFrontend
