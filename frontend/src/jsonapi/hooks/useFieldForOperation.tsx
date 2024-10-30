import { ComponentType, useMemo } from 'react'
import { BooleanInput, DateInput, DateTimeInput, NumberInput, TextInput, TimeInput } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import GeoJsonInput from '../../components/Input/GeoJsonInput'
import SchemaAutocompleteInput from '../components/SchemaAutocompleteInput'
import useResourceSchema from './useResourceSchema'

export interface FieldSchema {
  name: string
  reference?: string
  schema: OpenAPIV3.SchemaObject
  isRequired: boolean
  kind: 'attribute' | 'relationship' |'array-relationship'
}

export interface FieldDefinition {
  component: ComponentType<any>,
  props: any
}

export const getFieldSchema = (name: string, schema: OpenAPIV3.NonArraySchemaObject): FieldSchema | undefined => {
  const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties 
  const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties
  const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as Record<string, OpenAPIV3.NonArraySchemaObject>

  const isRequired = jsonApiPrimaryDataProperties?.attributes?.required?.includes(name) ??
                      jsonApiPrimaryDataProperties?.relationships?.required?.includes(name) ?? 
                      false

    if (name === "id" && jsonApiResourceId !== undefined) {
      // on create operations there is no id
      return {
        name: name, 
        schema: jsonApiResourceId,
        isRequired: schema?.required?.includes('id') ?? false, 
        kind: 'attribute'
      }
    }

    if (jsonApiResourceAttributes && Object.hasOwn(jsonApiResourceAttributes, name)) {
      return {
        name: name, 
        schema: jsonApiResourceAttributes?.[name] as OpenAPIV3.NonArraySchemaObject, 
        isRequired: isRequired, 
        kind: 'attribute'
      }
    }

    if (jsonApiResourceRelationships && Object.hasOwn(jsonApiResourceRelationships, name)) {
      const relationSchema = jsonApiResourceRelationships?.[name] as OpenAPIV3.SchemaObject
      const relationDataSchema = relationSchema?.properties?.data as OpenAPIV3.SchemaObject

      if (relationDataSchema?.type === 'array') {
        const _relationSchema = relationDataSchema.items as OpenAPIV3.NonArraySchemaObject
        const type = _relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
        return {
          name: name, 
          reference: type?.enum?.[0],
          schema: _relationSchema,
          isRequired: isRequired, 
          kind: 'array-relationship'
        }
      } else {
        const _relationSchema = relationSchema?.properties?.data as OpenAPIV3.NonArraySchemaObject
        const type = _relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
        return {
          name: name, 
          reference: type?.enum?.[0],
          schema: relationSchema as OpenAPIV3.NonArraySchemaObject,
          isRequired: isRequired, 
          kind: 'relationship'
        }
      }
        
    }
};

export const getFieldDefinition = (fieldSchema: FieldSchema): FieldDefinition | undefined => {
  const commonProps = {
    source: fieldSchema.name,
    label: fieldSchema.schema.title ?? fieldSchema.name,
    required: fieldSchema.isRequired,
    disabled: fieldSchema.schema.readOnly ?? false,
    helperText: fieldSchema.schema.description,
    ...(fieldSchema.reference && {reference: fieldSchema.reference})
  }

  if (fieldSchema?.kind === 'attribute'){
    // See https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#name-defined-formats for valid schema.format strings
    console.log(fieldSchema)
    if (['integer', 'number'].includes(fieldSchema.schema.type ?? '')) {
      return {component: NumberInput, props: commonProps}
    } else if (fieldSchema.schema.type === 'boolean') {
      return {component: BooleanInput, props: {...commonProps, defaultValue: fieldSchema.schema.default ?? false}}
    } else if (fieldSchema.schema.type === 'string') {
      // Time specific fields
      if (fieldSchema.schema.format === 'date-time') {
        return {component: DateTimeInput, props: commonProps}
      } else if (fieldSchema.schema.format === 'date') {
        return {component: DateInput, props: commonProps}
      } else if (fieldSchema.schema.format === 'time') {
        return {component: TimeInput, props: commonProps}
      } else if (fieldSchema.schema.format === 'duration') {
        // TODO: is there a durationinput?
        // https://mui.com/x/react-date-pickers/
        return {component: TextInput, props: commonProps}
      } 
    } else if (fieldSchema.schema.type === 'object') {
     
      const typeOfObject = fieldSchema.schema.properties?.type as OpenAPIV3.SchemaObject
      if (typeOfObject?.enum?.[0] === 'MultiPolygon')
      return {component: GeoJsonInput, props: commonProps}
    }
    // default fallback
    return {component: TextInput, props: commonProps}
  } else if (fieldSchema?.kind === 'relationship' ) {
    return {
      component: SchemaAutocompleteInput, 
      props: commonProps
    }
    
  } else if (fieldSchema?.kind === 'array-relationship') {
    return {
      component: SchemaAutocompleteInput, 
      props: {...commonProps, multiple: true}
    }
  }
}


const useFieldForOperation = (
  name: string, 
  operationId: string,

): FieldDefinition | undefined => {
  const {schema} = useResourceSchema(operationId)

  const fieldSchema = useMemo<FieldSchema | undefined>(()=> schema && getFieldSchema(name, schema), [schema, name])
    
  return fieldSchema && getFieldDefinition(fieldSchema)
}

export default useFieldForOperation
