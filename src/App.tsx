import {
  Admin,
  Resource,
  ListGuesser,
  defaultTheme,
  RaThemeOptions
} from "react-admin";
import jsonApidataProvider from "./jsonapi/dataProvider";
import { ResourceList } from "./jsonapi/components/ResourceList";
import WmsIcon from '@mui/icons-material/Map';
import { ResourceEdit } from "./jsonapi/components/ResourceEdit";
import { ResourceCreate } from "./jsonapi/components/ResourceCreate";
import tokenAuthProvider, { fetchJsonWithAuthToken } from "./authProvider";
import { Route } from 'react-router-dom';

// TODO: get api url from env
const authProvider = tokenAuthProvider({loginUrl:'http://localhost:8001/api/auth/login/', logoutUrl:'http://localhost:8001/api/auth/login/'});
const dataProvider = jsonApidataProvider({apiUrl: 'http://localhost:8001/api', httpClient: fetchJsonWithAuthToken } );
const lightTheme = defaultTheme;
const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } };



export const App = () => {
  return(

    <Admin 
      theme={lightTheme} 
      darkTheme={darkTheme} 
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      <Resource 
        name="registry/wms" 
        options={{label: 'WebMapService', type: 'WebMapService'}} 
        icon={WmsIcon} 
        recordRepresentation={(record) => record.title}
        list={ResourceList} 
        edit={ResourceEdit}
        create={ResourceCreate}
      >
            <Route path=":id/layers" element={<ResourceList />} />
      </Resource>
      
      <Resource 
        name="registry/layers" 
        options={{label: 'Layers', type: 'Layers'}} 
        icon={WmsIcon} 
        recordRepresentation={(record) => record.title}
        list={ResourceList} 
        edit={ResourceEdit}
        create={ResourceCreate}/>
    </Admin>

  )
};
