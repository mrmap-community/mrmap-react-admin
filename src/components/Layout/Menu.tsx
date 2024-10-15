import { createElement, useMemo, useState } from 'react';
import {
    DashboardMenuItem,
    MenuItemLink,
    MenuProps,
    useResourceDefinition,
    useSidebarState
} from 'react-admin';

import { Box } from '@mui/material';

import SubMenu from './SubMenu';



type MenuName = 'menuWms' | 'menuWfs' | 'menuCsw'| 'menuAccounts';

const Menu = ({ dense = false }: MenuProps) => {
    const [state, setState] = useState({
        menuWms: true,
        menuWfs: true,
        menuCsw: true,
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
    
    const wmsIconComponent = useMemo(()=> wmsIcon === undefined ? <div></div>: createElement(wmsIcon),[wmsIcon])
    const layerIconComponent = useMemo(()=> layerIcon === undefined ? <div></div>: createElement(layerIcon),[layerIcon])
    const wfsIconComponent = useMemo(()=> wfsIcon === undefined ? <div></div>: createElement(wfsIcon),[wfsIcon])
    const featureTypeIconComponent = useMemo(()=> featureTypeIcon === undefined ? <div></div>: createElement(featureTypeIcon),[featureTypeIcon])


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
            
            
        </Box>
    );
};

export default Menu;
