import { useContext, useMemo, type ReactElement } from 'react';
import {
  Admin,
  CustomRoutes,
  defaultTheme, Loading,
  localStorageStore,
  Resource,
  ResourceProps,
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
import { type OpenAPIV3 } from 'openapi-client-axios';

import { HttpClientContext } from '../context/HttpClientContext';
import { CreateGuesser, EditGuesser } from '../jsonapi/components/FormGuesser';
import ListGuesser from '../jsonapi/components/ListGuesser';
import authProvider from '../providers/authProvider';
import jsonApiDataProvider from '../providers/dataProvider';
import Dashboard from './Dashboard/Dashboard';
import MyLayout from './Layout/Layout';
import MapViewer from './MapViewer/MapViewer';

export const TOKENNAME = 'token'
const STORE_VERSION = '1'

export interface Token {
  token: string
  expiry: string
}

const resources: Array<ResourceProps> = [
  {name: "WebMapService", icon: MapIcon},
  {name: "HistoricalWebMapService"},
  {name: "Layer", icon: LayersIcon},
  {name: "WebFeatureService", icon: TravelExploreIcon},
  {name: "FeatureType", icon: NotListedLocationIcon},
  {name: "CatalogueService", icon: PlagiarismIcon},
  {name: "Keyword", icon: LocalOfferIcon},
  {name: "DatasetMetadataRecord", icon: DatasetIcon},
  {name: "BackgroundProcess"},
  {name: "AllowedWebMapServiceOperation"},
  {name: "User", icon: CustomerIcon},
  {name: "Organization", icon: CorporateFareIcon}
]

const MrMapFrontend = (): ReactElement => {
  const lightTheme = defaultTheme
  const customTheme: RaThemeOptions = { ...defaultTheme, transitions: {} }

  const darkTheme: RaThemeOptions = { ...defaultTheme, palette: { mode: 'dark' } }

  const { client, isLoading } = useContext(HttpClientContext)

  const dataProvider = useMemo(() => {
    if (!isLoading && client !== undefined) {
      const asyncClient = client.api.getClient()
      return jsonApiDataProvider({
        entrypoint: 'http://localhost:8001/',
        httpClient: asyncClient,
        realtimeBus: 'ws://localhost:8001/ws/default/'
      })
    }
  }, [isLoading, client])
  
  const resourceDefinitions = useMemo(() => {
    return resources.map((resource)=> {
      const createOperation = client?.api.getOperation(`create_${resource.name}`)
      const editOperation = client?.api.getOperation(`partial_update_${resource.name}`)
      const listOperation = client?.api.getOperation(`list_${resource.name}`)
      const related_list_operations = client?.api.getOperations().filter((operation) => operation.operationId?.includes(`_of_${resource.name}`)) as OpenAPIV3.NonArraySchemaObject[]
      const related_list_resources = related_list_operations?.map((schema) => {
        const properties = schema?.properties as OpenAPIV3.NonArraySchemaObject
        const jsonApiTypeProperty = properties?.type as OpenAPIV3.NonArraySchemaObject
        const jsonApiTypeReferences = jsonApiTypeProperty?.allOf as OpenAPIV3.SchemaObject[]
        return jsonApiTypeReferences?.[0]?.enum?.[0] as string
      }) ?? []

      return {
        ...(resource.create || createOperation && {create: CreateGuesser, hasCreate: true}),
        ...(resource.list || listOperation && {list: ListGuesser, hasList: true}),
        ...(resource.edit || editOperation && {edit: EditGuesser, hasEdit: true}),
        
        ...(resource.children || related_list_operations && { 
          children: related_list_resources.map((relatedResource) => <Route key={''} path={`:id/${resource.name}`} element={<ListGuesser resource={resource.name} relatedResource={relatedResource}> </ListGuesser>}></Route>)
        }) as ReactElement[],
        ...resource,
      }
    })
  }, [client])


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
        {resourceDefinitions.map((resource) => (
          <Resource key={resource.name} {...resource} />
        ))}

        {/* ows context based mapviewer */}
        <CustomRoutes>
          <Route path="/viewer" element={<MapViewer />} />
        </CustomRoutes>
      </Admin>
    )
  }
}

export default MrMapFrontend
