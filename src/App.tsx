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
import { Route } from 'react-router-dom';
import { AdminGuesser, OpenApiAdmin, openApiDataProvider, openApiSchemaAnalyzer } from "@api-platform/admin";


const apiEntryPoint = 'http://localhost:8001/api'

// TODO: get api url from env
const authProvider = tokenAuthProvider({loginUrl: `${apiEntryPoint}auth/login/`, logoutUrl:`${apiEntryPoint}auth/login/`});
const jsonApiDataProvider = jsonApidataProvider({apiUrl: 'http://localhost:8001/api/schema',  } );
const lightTheme = defaultTheme;
const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } };




const dataProvider = openApiDataProvider({
  // Use any data provider you like
  dataProvider: jsonApiDataProvider,
  entrypoint: apiEntryPoint,
  docEntrypoint: 'http://localhost:8001/api/schema',
});


const schemaAnalyzer = {
  getFieldNameFromSchema: () => "name",
  getOrderParametersFromSchema: () => Promise.resolve([]),
  getFiltersParametersFromSchema: () => Promise.resolve([]),
  getFieldType: () => "text"
};


export const App = () => {
  return(

    <AdminGuesser
      dataProvider={jsonApiDataProvider}
      schemaAnalyzer={schemaAnalyzer}
    />

  )
};
