import {
  Admin,
  Resource,
  ListGuesser,
  EditGuesser,
  defaultTheme,
  RaThemeOptions
} from "react-admin";
import jsonApidataProvider from "./services/dataProvider";
import { WebMapServiceList } from "./components/WmsList";

// TODO: get api url from env
const dataProvider = jsonApidataProvider('http://localhost:8001/api');
const lightTheme = defaultTheme;
const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } };

export const App = () => {
  return(

    <Admin theme={lightTheme} darkTheme={darkTheme} dataProvider={dataProvider}>
      <Resource name="registry/wms" list={WebMapServiceList} edit={EditGuesser}/>
      <Resource name="registry/layers" list={ListGuesser}/>
    </Admin>

  )
};
