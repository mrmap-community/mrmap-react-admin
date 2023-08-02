import { useContext } from 'react';
import { Edit, EditProps, SimpleForm, TextInput, useRecordContext, useResourceDefinition } from 'react-admin';
import HttpClientContext from '../../context/HttpClientContext';
import { getEncapsulatedSchema, getResourceSchema } from '../../openapi/parser';
import { OpenAPIV3 } from 'openapi-client-axios';



export interface FormGuesserProps {
    formType: "edit" | "create"
};


const FormGuesser = (props: FormGuesserProps) => {
    

    const def = useResourceDefinition();
    const httpClient = useContext(HttpClientContext);

    
    
    httpClient
    .then((client) => client.api.getOperation(`partial_update_${def.name}`))
    .then((operation) => getEncapsulatedSchema(operation))
    .then((schema) => {
        const jsonApiPrimaryDataProperties = schema?.properties as {[key: string]: OpenAPIV3.NonArraySchemaObject};
  
        const requiredFields = schema?.required ?? [];
      
        const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as {[key: string]: OpenAPIV3.NonArraySchemaObject};
        const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes as OpenAPIV3.NonArraySchemaObject;
        const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships as OpenAPIV3.NonArraySchemaObject;
    })

    const jsonApiType = def.options?.type;

    const onError = (error) => {
        // TODO: handle jsonapi errors 
    };
    

    console.log(def, props);


    return (
        <Edit
            {...props}
            queryOptions={{ refetchOnReconnect: true }}
            mutationOptions={ {onError, meta: {type: jsonApiType} } }
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

export default FormGuesser;