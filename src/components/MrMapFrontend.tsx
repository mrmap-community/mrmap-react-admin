import { type ReactElement, useContext } from 'react'
import {
  Admin,
  defaultTheme, Loading,
  type RaThemeOptions, Resource
} from 'react-admin'

import { HttpClientContext } from '../context/HttpClientContext'
import jsonApidataProvider from '../dataProvider'
import { CreateGuesser, EditGuesser } from '../jsonapi/components/FormGuesser'
import ListGuesser from '../jsonapi/components/ListGuesser'

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
    const jsonApiDataProvider = jsonApidataProvider({ entrypoint: 'http://localhost:8001', httpClient: asyncClient })

    return (
      <Admin
        theme={lightTheme}
        darkTheme={darkTheme}
        dataProvider={jsonApiDataProvider}
      >
        <Resource name={'WebMapService'} list={ListGuesser} create={CreateGuesser} edit={EditGuesser} hasCreate={true} hasEdit={true} hasShow={true} />
        <Resource name={'Layer'} list={ListGuesser} create={CreateGuesser} hasCreate={true} hasEdit={true} hasShow={true} />

      </Admin>
    )
  }
}

export default MrMapFrontend
