import { ReactNode, useContext, useEffect, useState } from 'react';
import { Edit, EditProps, SimpleForm, useResourceDefinition, NumberInput, DateTimeInput, BooleanInput, TextInput, useRecordContext, DateInput, TimeInput } from 'react-admin';
import HttpClientContext from '../../context/HttpClientContext';
import { getEncapsulatedSchema } from '../../openapi/parser';
import { OpenAPIV3 } from 'openapi-client-axios';



const inferElementFromSchema = ( name: string, schema: OpenAPIV3.NonArraySchemaObject, isRequired: boolean = false, record: any): ReactNode =>{
    // See https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#name-defined-formats for valid schema.format strings
    
    const commonProps = {
        source: name,
        label: schema.title ?? name,
        required: isRequired,
        disabled: schema.readOnly ?? false,
        helperText: schema.description,
        record: record,
    }
    if (['integer', 'number'].includes(schema.type ?? '')  ) {
        return <NumberInput {...commonProps}/>
    } else if (schema.type === 'boolean') {
        return <BooleanInput {...commonProps}/>
    } else if (schema.type === 'string') {
        // Time specific fields
        if (schema.format === 'date-time') {
            return <DateTimeInput {...commonProps}/>
        } else if (schema.format === 'date') {
            return <DateInput {...commonProps}/>
        } else if (schema.format === 'time') {
            return <TimeInput {...commonProps}/>
        } else if (schema.format === 'duration') {
            // TODO: is there a durationinput?
            return <TextInput {...commonProps}/>
        }

    }


    // default fallback
    return <TextInput {...commonProps}/>
}


const EditGuesser = (props: EditProps) => {
    
    const def = useResourceDefinition();
    const record = useRecordContext(props);

    const httpClient = useContext(HttpClientContext);
    const [fields, setFields] = useState<ReactNode[]>();


    useEffect(()=>{
        if (def){
            httpClient
            .then((client) => client.api.getOperation(`partial_update_${def.name}`))
            .then((operation) => getEncapsulatedSchema(operation))
            .then((schema) => {
                const _fields: ReactNode[] = [];


                const jsonApiPrimaryDataProperties = schema?.properties as {[key: string]: OpenAPIV3.NonArraySchemaObject};
        
                const requiredFields = schema?.required ?? [];
                const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as {[key: string]: OpenAPIV3.NonArraySchemaObject};
                _fields.push(inferElementFromSchema("id", jsonApiResourceId, requiredFields.includes("id") ?? false, record));


                const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties as OpenAPIV3.NonArraySchemaObject;
                Object.entries(jsonApiResourceAttributes).forEach(([name, schema]) => {
                    const isRequired = jsonApiPrimaryDataProperties?.attributes?.required?.includes(name) ?? false;
                    _fields.push(inferElementFromSchema(name, schema, isRequired, record));
                });

                // TODO:
                const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships as OpenAPIV3.NonArraySchemaObject;
                
                
                return _fields;
            
            })
            .then((_fields) => setFields(_fields));
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