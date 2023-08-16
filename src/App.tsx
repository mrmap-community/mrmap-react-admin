import { type ReactElement, useContext } from 'react'
import {
  Admin,
  defaultTheme, type RaThemeOptions, Resource
} from 'react-admin'

import HttpClientContext from './context/HttpClientContext'
import jsonApidataProvider from './dataProvider'
import { CreateGuesser, EditGuesser } from './jsonapi/components/FormGuesser'
import ListGuesser from './jsonapi/components/ListGuesser'

// const authProvider = tokenAuthProvider({loginUrl: `${apiEntryPoint}auth/login/`, logoutUrl:`${apiEntryPoint}auth/login/`});
const lightTheme = defaultTheme
const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } }

export const App = (): ReactElement => {
  const httpClient = useContext(HttpClientContext)

  // TODO: get api url from env
  const jsonApiDataProvider = jsonApidataProvider({ entrypoint: 'http://localhost:8001', docUrl: 'http://localhost:8001/api/schema', httpClient })

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
