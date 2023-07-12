import { Edit, SimpleForm, TextInput, useRecordContext, useResourceDefinition } from 'react-admin';
import Typography from '@mui/material/Typography';

const Aside = () => {

    const record = useRecordContext();
    const def = useResourceDefinition();

    // TODO: provide history of this record
    return (
        <div style={{ width: 200, margin: '1em' }}>
            <Typography variant="h6">{def.options?.label} details</Typography>
            {record && (
                <Typography variant="body2">
                    Creation date: {record.createdAt}
                </Typography>
            )}
        </div>
    );
};


export const ResourceEdit = () => {
    
    const def = useResourceDefinition();
    const jsonApiType = def.options?.type;

    const onError = (error) => {
        // TODO: handle jsonapi errors 
    };
    


    return (
        <Edit
            queryOptions={{ refetchOnReconnect: true }}
            mutationOptions={ {onError, meta: {type: jsonApiType} } }
            aside={<Aside/>}
            mutationMode='pessimistic'
        >
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
                <TextInput source="title" />
                <TextInput multiline source="abstract" />
               
                
            </SimpleForm>
        </Edit>
    )
};