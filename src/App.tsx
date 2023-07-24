import {
  Admin,
  Resource,
  ListGuesser,
  defaultTheme,
  RaThemeOptions
} from "react-admin";
import jsonApidataProvider from "./dataProvider";
import { JsonApiList } from "./jsonapi/components/ResourceList";
import WmsIcon from '@mui/icons-material/Map';
import { ResourceEdit } from "./jsonapi/components/ResourceEdit";
import { ResourceCreate } from "./jsonapi/components/ResourceCreate";
import tokenAuthProvider, { fetchJsonWithAuthToken } from "./authProvider";
import { OpenApiAdmin } from "@api-platform/admin";
import schemaAnalyzer from "./openapi/schemaAnalyzer";

const apiEntryPoint = 'http://localhost:8001/api'

// TODO: get api url from env
//const authProvider = tokenAuthProvider({loginUrl: `${apiEntryPoint}auth/login/`, logoutUrl:`${apiEntryPoint}auth/login/`});
const jsonApiDataProvider = jsonApidataProvider({entrypoint: 'http://localhost:8001', docUrl: "http://localhost:8001/api/schema"  } );
const lightTheme = defaultTheme;
const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } };



export const App = () => {
  return(

    <OpenApiAdmin
      theme={lightTheme} 
      darkTheme={darkTheme} 
      dataProvider={jsonApiDataProvider}
      entrypoint="http://localhost:8001/api"
      docEntrypoint="http://localhost:8001/api/schema"
      schemaAnalyzer={schemaAnalyzer}
    >
       
    </OpenApiAdmin>

  )
};
