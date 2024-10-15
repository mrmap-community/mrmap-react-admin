import { createElement, useMemo, useState } from 'react';
import {
    DashboardMenuItem,
    MenuItemLink,
    MenuProps,
    useResourceDefinition,
    useSidebarState
} from 'react-admin';

import FeedIcon from '@mui/icons-material/Feed';
import { Box } from '@mui/material';

import SubMenu from './SubMenu';


type MenuName = 'menuWms' | 'menuWfs' | 'menuCsw'| 'menuMetadata'| 'menuAccounts';

const Menu = ({ dense = false }: MenuProps) => {
    const [state, setState] = useState({
        menuWms: true,
        menuWfs: true,
        menuCsw: true,
        menuMetadata: true,
        menuAccounts: true,
    });
    const [open] = useSidebarState();

    const handleToggle = (menu: MenuName) => {
        setState(state => ({ ...state, [menu]: !state[menu] }));
    };

    const { name: wmsName, icon: wmsIcon } = useResourceDefinition({ resource: "WebMapService" })
    const { name: layerName, icon: layerIcon } = useResourceDefinition({ resource: "Layer" })
    const { name: wfsName, icon: wfsIcon } = useResourceDefinition({ resource: "WebFeatureService" })
    const { name: featureTypeName, icon: featureTypeIcon } = useResourceDefinition({ resource: "FeatureType" })
    const { name: cswName, icon: cswIcon } = useResourceDefinition({ resource: "CatalogueService" })
    const { name: datasetName, icon: datasetIcon } = useResourceDefinition({ resource: "DatasetMetadataRecord" })

    const wmsIconComponent = useMemo(()=> wmsIcon === undefined ? <div></div>: createElement(wmsIcon),[wmsIcon])
    const layerIconComponent = useMemo(()=> layerIcon === undefined ? <div></div>: createElement(layerIcon),[layerIcon])
    const wfsIconComponent = useMemo(()=> wfsIcon === undefined ? <div></div>: createElement(wfsIcon),[wfsIcon])
    const featureTypeIconComponent = useMemo(()=> featureTypeIcon === undefined ? <div></div>: createElement(featureTypeIcon),[featureTypeIcon])
    const cswIconComponent = useMemo(()=> cswIcon === undefined ? <div></div>: createElement(cswIcon),[cswIcon])
    const datasetIconComponent = useMemo(()=> datasetIcon === undefined ? <div></div>: createElement(datasetIcon),[datasetIcon])


    return (
        <Box
            sx={{
                width: open ? 200 : 50,
                marginTop: 1,
                marginBottom: 1,
                transition: theme =>
                    theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
            }}
        >
            <DashboardMenuItem />
            <SubMenu
                handleToggle={() => handleToggle('menuWms')}
                isOpen={state.menuWms}
                name={wmsName}
                icon={wmsIconComponent}
                dense={dense}
            >
                <div></div>
                <MenuItemLink
                    to={`/${wmsName}`}
                    state={{ _scrollToTop: true }}
                    primaryText={wmsName}
                    leftIcon={wmsIconComponent}
                    dense={dense}
                />
                <MenuItemLink
                    to={`/${layerName}`}
                    state={{ _scrollToTop: true }}
                    primaryText={layerName}
                    leftIcon={layerIconComponent}
                    dense={dense}
                />
            </SubMenu>
            <SubMenu
                handleToggle={() => handleToggle('menuWfs')}
                isOpen={state.menuWfs}
                name={wfsName}
                icon={wfsIconComponent}
                dense={dense}
            >
                <MenuItemLink
                    to={`/${wfsName}`}
                    state={{ _scrollToTop: true }}
                    primaryText={wfsName}
                    leftIcon={wfsIconComponent}
                    dense={dense}
                />
                <MenuItemLink
                    to={`/${featureTypeName}`}
                    state={{ _scrollToTop: true }}
                    primaryText={featureTypeName}
                    leftIcon={featureTypeIconComponent}
                    dense={dense}
                />
            </SubMenu>

            <MenuItemLink
                to={`/${cswName}`}
                state={{ _scrollToTop: true }}
                primaryText={cswName}
                leftIcon={cswIconComponent}
                dense={dense}
            />
            <SubMenu
                handleToggle={() => handleToggle('menuMetadata')}
                isOpen={state.menuMetadata}
                name={"Metadata"}
                icon={<FeedIcon/>}
                dense={dense}
            >
                <MenuItemLink
                    to={`/${datasetName}`}
                    state={{ _scrollToTop: true }}
                    primaryText={datasetName}
                    leftIcon={datasetIconComponent}
                    dense={dense}
                />
                
            </SubMenu>           
            
        </Box>
    );
};

export default Menu;
