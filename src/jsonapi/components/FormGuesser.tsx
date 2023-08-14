import { ReactNode, useContext, useEffect, useState } from 'react';
import { Edit, EditProps, SimpleForm, TextInput, useRecordContext, useResourceDefinition, getElementsFromRecords,InferredElement, InferenceTypes, NumberField } from 'react-admin';
import HttpClientContext from '../../context/HttpClientContext';
import { getEncapsulatedSchema, getResourceSchema } from '../../openapi/parser';
import { OpenAPIV3 } from 'openapi-client-axios';



const inferElementFromSchema = ( name: string, schema: OpenAPIV3.NonArraySchemaObject): ReactNode =>{
    if (schema.type === 'integer' || ' number') {
        return <NumberField 
            source={name} 
            label={schema.title ?? name}           
        />
    }

}


const EditGuesser = (props: EditProps) => {
    
    const def = useResourceDefinition();
    const httpClient = useContext(HttpClientContext);
    const [fields, setFields] = useState<ReactNode[]>();


    useEffect(()=>{
        if (def){
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
        }
        
    }, [def, httpClient]);
    

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
               {fields}
               
                
            </SimpleForm>
        </Edit>
    )
};

export default EditGuesser;