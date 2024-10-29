import { useCallback, useMemo, useState } from 'react';
import { EditButton, RaRecord, Show, SimpleShowLayoutProps, TabbedShowLayout, TextField, TopToolbar, useNotify, useRecordContext, useShowContext } from 'react-admin';

import { Grid, Tooltip } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

import CircleIcon from '@mui/icons-material/Circle';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EditGuesser } from '../../jsonapi/components/FormGuesser';
import { getAnchestors, getChildren } from '../MapViewer/utils';

const WmsShowActions = () => (
    <TopToolbar>
        <EditButton/>
    </TopToolbar>
);

interface LayerLabelProps {
    record: RaRecord
}

const LayerLabel = ({
    record
}: LayerLabelProps) => {
    return (
        <div  >
            {record.isActive ? <Tooltip title="Layer is activated"><CircleIcon color='success'/></Tooltip>: <Tooltip title="Layer is deactivated"><CircleIcon color='warning'/></Tooltip>}
            {record.isSpatialSecured ? <Tooltip title="Layer spatial secured"><VpnLockIcon color='info'/></Tooltip>: null}

            {record.title} 
            
        </div>
    )
};

const getSubTree = (nodes: RaRecord[], currentNode?: RaRecord) => {
    const node = currentNode || nodes.find((node) => node.mpttLft === 1)
    
    const children = node && getChildren(nodes, node)

    const subtree = children?.map(child => (
        <TreeItem 
            key={child.id} 
            itemId={child.id.toString()} 
            label={<LayerLabel record={child}/>}
        >
            {getSubTree(nodes, child)}
        </ TreeItem>
    )) || []

    if (currentNode === undefined && node !== undefined){
        return (
            <TreeItem 
                key={node.id} 
                itemId={node.id.toString()} 
                label={<LayerLabel record={node}/>} 
            >
                {...subtree}
            </ TreeItem>
        )
    } else {
        return subtree
    }
};


export const WmsLayers = () => {
    
    const { layerId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
        
    const { refetch } = useShowContext();
    const notify = useNotify();

    // this is the wms service record with all includes layers which are fetched in the parent component.
    const record = useRecordContext();

    const defaultExpandedItems = useMemo<string[]>(()=>{
        if (layerId !== ':layerId' && layerId) {
            const anchestors = getAnchestors(record?.layers.sort((a,b) => a.mpttLft > b.mpttLft), record?.layers.find((layer: RaRecord) => layer.id === layerId))
            return anchestors.map(layer => layer.id.toString())
        }
        return []
    },[layerId])

    const [expandedItems, setExpandedItems] = useState<string[]>(defaultExpandedItems);
    const onItemExpansionToggle =  useCallback((event: React.SyntheticEvent, itemIds: string[]) => {
    
        if (event.target.closest('.MuiTreeItem-iconContainer')) {
            setExpandedItems(itemIds)

        } else {
            event.stopPropagation();
        }
        
    }, [])

    const onSuccess = useCallback((record: RaRecord)=>{
        notify(
            'ra.notification.updated', 
            {
                messageArgs: { smart_count: 1 },
                undoable: false,
                type: 'success',
            }
    );
        // refetch the wms if the update was successfully
        refetch()
    },[notify, refetch])

    const onSelectedItemsChange = useCallback( (event: React.SyntheticEvent, itemids: string | null) =>{
        if (event.target.closest('.MuiTreeItem-iconContainer')) {
            return;
            
        }

        if (itemids !== null){
            if (layerId === ':layerId'){
                navigate(location.pathname.replace(
                    `/:layerId`, 
                    `/${itemids}`
                ))
            } else {
                navigate(location.pathname.replace(
                    `/${layerId}`, 
                    `/${itemids}`
                ))
            }
        }
    }, [layerId, navigate])

    const tree = useMemo(()=> record?.layers && getSubTree(record?.layers.sort((a,b) => a.mpttLft > b.mpttLft)) || [],[record?.layers])

    const rightContent = useMemo(()=> {
        if (layerId !== ':layerId') {
            return <EditGuesser
                id={layerId}
                resource='Layer'
                redirect={false}
                mutationOptions={{ meta: { type: "Layer" }, onSuccess}}
                
            />
        }
        return null
            
    }, [layerId])
      
    return (
        <Grid container spacing={2} sx={{ justifyContent: 'space-between' }} >
            <Grid item xs={4}>
                <SimpleTreeView
                    
                    selectedItems={layerId !== ':layerId' ? layerId: null}

                    onSelectedItemsChange={onSelectedItemsChange}
                    onExpandedItemsChange={onItemExpansionToggle}

                    expandedItems={expandedItems}
                >
                {tree}
                </SimpleTreeView>              
            </Grid>
            <Grid item xs={8}>
                {rightContent}
            </Grid>
        </Grid>
    )
}


export const WmsShow = (props: SimpleShowLayoutProps) => {

    

    return (
        <Show 
            queryOptions={{meta: {jsonApiParams:{include: 'layers'}}}}
            actions={<WmsShowActions/>}
        >
            <TabbedShowLayout>
                <TabbedShowLayout.Tab label="service">
                    
                    <TextField source="id" />
                    <TextField source="title" />
                    <TextField source="abstract" />
                </TabbedShowLayout.Tab>
                <TabbedShowLayout.Tab label="layers" path='layers/:layerId'>
                    <WmsLayers/>
                </TabbedShowLayout.Tab>
            </TabbedShowLayout>
        </Show>
    )
};
