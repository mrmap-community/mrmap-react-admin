import { type ReactElement, useContext, useMemo } from 'react';
import {
  Admin,
  CustomRoutes,
  defaultTheme, Loading,
  localStorageStore,
  type RaThemeOptions
} from 'react-admin';
import { Route } from 'react-router-dom';

import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import DatasetIcon from '@mui/icons-material/Dataset';
import LayersIcon from '@mui/icons-material/Layers';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MapIcon from '@mui/icons-material/Map';
import NotListedLocationIcon from '@mui/icons-material/NotListedLocation';
import CustomerIcon from '@mui/icons-material/Person';
import PlagiarismIcon from '@mui/icons-material/Plagiarism';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

import { HttpClientContext } from '../context/HttpClientContext';
import ResourceGuesser from '../jsonapi/components/ResourceGuesser';
import authProvider from '../providers/authProvider';
import jsonApidataProvider from '../providers/dataProvider';
import Dashboard from './Dashboard/Dashboard';
import MyLayout from './Layout/Layout';
import WmsList from './WMS/WmsList';
import WmsViewer from './WMS/WmsViewer';

export const TOKENNAME = 'token'
const STORE_VERSION = '1'

export interface Token {
  token: string
  expiry: string
}

const MrMapFrontend = (): ReactElement => {
  const lightTheme = defaultTheme
  const customTheme: RaThemeOptions = { ...defaultTheme, transitions: {} }

  const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } }

  const { client, isLoading } = useContext(HttpClientContext)

  const dataProvider = useMemo(() => {
    if (!isLoading && client !== undefined) {
      const asyncClient = client.api.getClient()
      return jsonApidataProvider({
        entrypoint: 'http://localhost:8001/',
        httpClient: asyncClient,
        realtimeBus: 'ws://localhost:8001/ws/default/'
      })
    }
  }, [isLoading, client])

  if (dataProvider === undefined) {
    return (
      <Loading loadingPrimary="OpenApi Client is loading...." loadingSecondary='OpenApi Client is loading....' />
    )
  } else {
    return (
      <Admin
        theme={lightTheme}
        darkTheme={darkTheme}
        lightTheme={customTheme}
        dataProvider={dataProvider}
        dashboard={Dashboard}
        authProvider={authProvider()}
        layout={MyLayout}
        store={localStorageStore(STORE_VERSION)}
      >
        {/* webmapservice */}
        <ResourceGuesser name={'WebMapService'} list={<WmsList />} icon={MapIcon} >
          <Route path=":id/viewer" element={<WmsViewer />} />
        </ResourceGuesser>
        <ResourceGuesser name={'HistoricalWebMapService'} />
        <ResourceGuesser name={'Layer'} icon={LayersIcon} />

        {/* webfeatureservice */}
        <ResourceGuesser name={'WebFeatureService'} icon={TravelExploreIcon} />
        <ResourceGuesser name={'FeatureType'} icon={NotListedLocationIcon} />

        {/* catalogueservice */}
        <ResourceGuesser name={'CatalogueService'} icon={PlagiarismIcon} />


        {/* metadata */}
        <ResourceGuesser name={'Keyword'} icon={LocalOfferIcon} />
        <ResourceGuesser name={'DatasetMetadataRecord'} icon={DatasetIcon} />

        {/* processing */}
        <ResourceGuesser name={'BackgroundProcess'} />

        {/* securityproxy */}
        <ResourceGuesser name={'AllowedWebMapServiceOperation'} />

        {/* accounting */}
        <ResourceGuesser name={'User'} icon={CustomerIcon}/>
        <ResourceGuesser name={'Organization'} icon={CorporateFareIcon}/>

        {/* ows context based mapviewer */}
        <CustomRoutes>
          <Route path="/viewer" element={<WmsViewer />} />
        </CustomRoutes>
      </Admin>
    )
  }
}

export default MrMapFrontend
