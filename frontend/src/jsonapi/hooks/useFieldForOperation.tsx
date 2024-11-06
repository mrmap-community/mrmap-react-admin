import { ComponentType, useMemo } from 'react'
import { BooleanField, BooleanInput, DateField, DateInput, DateTimeInput, email, EmailField, NumberField, NumberInput, TextInput, TimeInput, UrlField } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import GeoJsonField from '../../components/Field/GeoJsonField'
import TruncatedTextField from '../../components/Field/TruncatedTextField'
import GeoJsonInput from '../../components/Input/GeoJsonInput'
import ReferenceArrayField from '../components/ReferenceArrayField'
import ReferenceField from '../components/ReferenceField'
import SchemaAutocompleteInput from '../components/SchemaAutocompleteInput'
import useResourceSchema from './useResourceSchema'

export interface FieldSchema {
  name: string
  reference?: string
  resource: string
  schema: OpenAPIV3.SchemaObject
  isRequired: boolean
  kind: 'attribute' | 'relationship' |'array-relationship'
}

export interface FieldDefinition {
  component: ComponentType<any>,
  props: {
    source: string
    [key: string]: any
  }
}

export const getFieldSchema = (name: string, schema: OpenAPIV3.NonArraySchemaObject): FieldSchema | undefined => {
  const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties 
  const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties
  const jsonApiResourceTypeRef = jsonApiPrimaryDataProperties?.type?.allOf as OpenAPIV3.ArraySchemaObject[]
  const jsonApiResourceType = jsonApiResourceTypeRef?.[0].enum?.[0]
  const jsonApiResourceId = jsonApiPrimaryDataProperties?.id

  const isRequired = jsonApiPrimaryDataProperties?.attributes?.required?.includes(name) ??
                      jsonApiPrimaryDataProperties?.relationships?.required?.includes(name) ?? 
                      false

    if (name === "id" && jsonApiResourceId !== undefined) {
      // on create operations there is no id
      return {
        name: name, 
        resource: jsonApiResourceType,
        schema: jsonApiResourceId,
        isRequired: schema?.required?.includes('id') ?? false, 
        kind: 'attribute'
      }
    }

    if (jsonApiResourceAttributes && Object.hasOwn(jsonApiResourceAttributes, name)) {
      return {
        name: name, 
        resource: jsonApiResourceType,
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
          resource: jsonApiResourceType,
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
          resource: jsonApiResourceType,
          schema: relationSchema as OpenAPIV3.NonArraySchemaObject,
          isRequired: isRequired, 
          kind: 'relationship'
        }
      }
        
    }
};

export const getFieldDefinition = (fieldSchema: FieldSchema, forInput: boolean = true): FieldDefinition | undefined => {
  const commonProps = {
    source: fieldSchema.name,
    label: fieldSchema.schema.title ?? fieldSchema.name,
    disabled: fieldSchema.schema.readOnly ?? false,
    ...(forInput && {required: fieldSchema.isRequired, helperText: fieldSchema.schema.description}),
    ...(fieldSchema.reference && {reference: fieldSchema.reference})
  }

  if (fieldSchema?.kind === 'attribute'){
    // See https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#name-defined-formats for valid schema.format strings
    if (['integer', 'number'].includes(fieldSchema.schema.type ?? '')) {
      return {component: forInput ? NumberInput: NumberField, props: commonProps}
    } else if (fieldSchema.schema.type === 'boolean') {
      return {component: forInput ? BooleanInput: BooleanField, props: {...commonProps, defaultValue: fieldSchema.schema.default ?? false}}
    } else if (fieldSchema.schema.type === 'string') {
      // Time specific fields
      if (fieldSchema.schema.format === 'date-time') {
        return {component: forInput ? DateTimeInput: DateField, props: {showTime: true, ...commonProps}}
      } else if (fieldSchema.schema.format === 'date') {
        return {component: forInput ? DateInput: DateField, props: commonProps}
      } else if (fieldSchema.schema.format === 'time') {
        return {component: forInput ? TimeInput: DateField, props: {showTime: true, ...commonProps}}
      } else if (fieldSchema.schema.format === 'duration') {
        // TODO: is there a durationinput?
        // https://mui.com/x/react-date-pickers/
        return {component: TextInput, props: commonProps}
      } else if (fieldSchema.schema.format === 'uri'){
        // TODO: pass in regex validation for uri
        return {component: forInput ? TextInput: UrlField, props: commonProps}
      } else if (fieldSchema.schema.format === 'email'){
        return {component: forInput ? TextInput: EmailField, props: {...(forInput && {validate: [email]}),...commonProps}}
      } else if (fieldSchema.schema.format === 'geojson'){
        return {component: forInput ? GeoJsonInput: GeoJsonField, props: {...commonProps}}
      }
    } 
    
  } else if (fieldSchema?.kind === 'relationship' ) {
    return {
      component: forInput ? SchemaAutocompleteInput: ReferenceField, 
      props: {...commonProps, ...(forInput ? {target: fieldSchema.name, link: 'edit'}: {reference: fieldSchema.reference, target: fieldSchema.resource,})}
    }
    
  } else if (fieldSchema?.kind === 'array-relationship') {
    const props = {...commonProps, ...(forInput ? {multiple: true}: {reference: fieldSchema.reference, target: fieldSchema.resource,})}
    return {
      component: forInput ? SchemaAutocompleteInput: ReferenceArrayField, 
      props: props
    }
  }

  // default fallback
  return {
    component: forInput ? TextInput: TruncatedTextField, 
    props: {textOverflow: 'ellipsis', ...commonProps}
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
