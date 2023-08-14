import {
  Admin,
  Resource,
  defaultTheme,
  RaThemeOptions
} from "react-admin";
import jsonApidataProvider from "./dataProvider";
import FormGuesser from "./jsonapi/components/FormGuesser";
import schemaAnalyzer from "./openapi/schemaAnalyzer";
import ListGuesser from "./jsonapi/components/ListGuesser";
import { useContext } from "react";
import HttpClientContext from "./context/HttpClientContext";
import EditGuesser from "./jsonapi/components/FormGuesser";



//const authProvider = tokenAuthProvider({loginUrl: `${apiEntryPoint}auth/login/`, logoutUrl:`${apiEntryPoint}auth/login/`});
const lightTheme = defaultTheme;
const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } };


export const App = () => {

  const httpClient = useContext(HttpClientContext);

  // TODO: get api url from env
  const jsonApiDataProvider = jsonApidataProvider({entrypoint: 'http://localhost:8001', docUrl: "http://localhost:8001/api/schema", httpClient: httpClient } );


  return(

    <Admin
      theme={lightTheme} 
      darkTheme={darkTheme} 
      dataProvider={jsonApiDataProvider}
    >
      <Resource name={"WebMapService"} list={ListGuesser} create={FormGuesser} edit={EditGuesser}  hasCreate={true} hasEdit={true} hasShow={true}/>
      <Resource name={"Layer"} list={ListGuesser} create={FormGuesser} hasCreate={true} hasEdit={true} hasShow={true}/>
       
    </Admin>

  )
};
