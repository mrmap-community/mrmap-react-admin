import { type ReactElement, useContext } from 'react'
import {
  Admin,
  defaultTheme, Loading,
  type RaThemeOptions, Resource
} from 'react-admin'

import { HttpClientContext } from '../context/HttpClientContext'
import { CreateGuesser, EditGuesser } from '../jsonapi/components/FormGuesser'
import ListGuesser from '../jsonapi/components/ListGuesser'
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
        <Resource name={'WebMapService'} list={ListGuesser} create={CreateGuesser} edit={EditGuesser} hasCreate={true} hasEdit={true} hasShow={true} />
        <Resource name={'Layer'} list={ListGuesser} create={CreateGuesser} hasCreate={true} hasEdit={true} hasShow={true} />
        <Resource name={'WebFeatureService'} list={ListGuesser} create={CreateGuesser} edit={EditGuesser} hasCreate={true} hasEdit={true} hasShow={true} />
        <Resource name={'FeatureType'} list={ListGuesser} create={CreateGuesser} hasCreate={true} hasEdit={true} hasShow={true} />

      </Admin>
    )
  }
}

export default MrMapFrontend
