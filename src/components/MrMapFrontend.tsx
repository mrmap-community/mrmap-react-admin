import { type ReactElement, useContext, useMemo } from 'react'
import {
  Admin,
  defaultTheme, Loading,
  type RaThemeOptions
} from 'react-admin'

import { HttpClientContext } from '../context/HttpClientContext'
import ResourceGuesser from '../jsonapi/components/ResourceGuesser'
import authProvider from '../providers/authProvider'
import jsonApidataProvider from '../providers/dataProvider'

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
    const jsonApiDataProvider = jsonApidataProvider({ entrypoint: 'https://mrmap.geospatial-interoperability-solutions.eu/', httpClient: asyncClient })

    return (
      <Admin
        theme={lightTheme}
        darkTheme={darkTheme}
        dataProvider={jsonApiDataProvider}
        authProvider={authProvider()}
      >
        <ResourceGuesser name={'WebMapService'} />
        <ResourceGuesser name={'Layer'} />
        <ResourceGuesser name={'WebFeatureService'} />
        <ResourceGuesser name={'FeatureType'} />

      </Admin>
    )
  }
}

export default MrMapFrontend
