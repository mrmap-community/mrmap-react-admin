import {
  ResourceProps
} from 'react-admin';

import AgricultureIcon from '@mui/icons-material/Agriculture';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import DatasetIcon from '@mui/icons-material/Dataset';
import LayersIcon from '@mui/icons-material/Layers';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MapIcon from '@mui/icons-material/Map';
import NotListedLocationIcon from '@mui/icons-material/NotListedLocation';
import CustomerIcon from '@mui/icons-material/Person';
import PlagiarismIcon from '@mui/icons-material/Plagiarism';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import CatalogueServiceList from '../Lists/CatalogueServiceList';
import WmsList from '../Lists/WmsList';
import { WmsShow } from '../Show/WmsShow';
import CreateAllowedWebMapServiceOperation from './AllowedWebMapServiceOperation/CreateAllowedWebMapServiceOperation';
import EditAllowedWebMapServiceOperation from './AllowedWebMapServiceOperation/EditAllowedWebMapServiceOperation';

const RESOURCES: Array<ResourceProps> = [
  {name: "WebMapService", icon: MapIcon, list: WmsList, show: WmsShow},
  {name: "HistoricalWebMapService"},
  {name: "Layer", icon: LayersIcon},
  {name: "WebFeatureService", icon: TravelExploreIcon},
  {name: "FeatureType", icon: NotListedLocationIcon},
  {name: "CatalogueService", icon: PlagiarismIcon, list: CatalogueServiceList},
  {name: "HarvestingJob", icon: AgricultureIcon},

  {name: "Keyword", icon: LocalOfferIcon},
  {name: "DatasetMetadataRecord", icon: DatasetIcon},
  {name: "ServiceMetadataRecord", icon: DatasetIcon},
  {name: "BackgroundProcess"},
  {name: "AllowedWebMapServiceOperation", icon: VpnLockIcon, create: CreateAllowedWebMapServiceOperation, edit: EditAllowedWebMapServiceOperation},
  {name: "User", icon: CustomerIcon},
  {name: "Organization", icon: CorporateFareIcon},
];

export default RESOURCES;