import { useMemo, useState } from 'react';
import { EditButton, RaRecord, Show, SimpleShowLayoutProps, TabbedShowLayout, TextField, TopToolbar, useRecordContext } from 'react-admin';

import { Grid } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

import { EditGuesser } from '../../jsonapi/components/FormGuesser';
import { getChildren } from '../MapViewer/utils';

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
            {record.title} 
            
        </div>
    )
};

const getSubTree = (nodes: RaRecord[], currentNode?: RaRecord) => {
    const node = currentNode || nodes.find((node) => node.mpttLft === 1)
    
    const children = node && getChildren(nodes, node)

    const subtree = children?.map(child => (
        <TreeItem key={child.id} itemId={child.id.toString()} label={<LayerLabel record={child}/>}>
            {getSubTree(nodes, child)}
        </ TreeItem>
    )) || []

    if (currentNode === undefined && node !== undefined){
        return <TreeItem key={node.id} itemId={node.id.toString()} label={<LayerLabel record={node}/>} >
            
            {...subtree}
        </ TreeItem> 
    } else {
        return subtree
    }
};

export const WmsLayers = () => {
    
    const record = useRecordContext();

    const tree = useMemo(()=> record?.layers && getSubTree(record?.layers.sort((a,b) => a.mpttLft > b.mpttLft)) || [],[record?.layers])

    const [selectedItem, setSelectedItem] = useState<string>(record?.layers.find((layer: RaRecord) => layer.mpttLft === 1).id)
    
    return (
        <Grid container spacing={2} sx={{ justifyContent: 'space-between' }} >
            <Grid item xs={4}>
                <SimpleTreeView
                    selectedItems={selectedItem}
                    onSelectedItemsChange={
                        (event, itemids) => {
                            itemids?.length && itemids?.length > 0 && setSelectedItem(itemids)
                            
                        }
                    }
                    onItemExpansionToggle={(event) => console.log('onItemExpansionToggle',event)}
                >
                {tree}
                </SimpleTreeView>              
            </Grid>
            <Grid item xs={8}>
                <EditGuesser
                    id={selectedItem}
                    resource='Layer'
                />
           
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
                <TabbedShowLayout.Tab label="layers" path='layers'>
                    <WmsLayers/>
                </TabbedShowLayout.Tab>
            </TabbedShowLayout>
        </Show>
    )
};
