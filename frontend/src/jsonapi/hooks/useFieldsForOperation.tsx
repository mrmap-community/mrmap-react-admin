import { useMemo } from 'react';

import { type OpenAPIV3 } from 'openapi-client-axios';

import { FieldDefinition, FieldSchema, getFieldDefinition, getFieldSchema } from './useFieldForOperation';
import useResourceSchema from './useResourceSchema';

const encapsulateFields = (schema: OpenAPIV3.NonArraySchemaObject) => {

  const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties 
  const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties
  const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as Record<string, OpenAPIV3.NonArraySchemaObject>

  return [
    ...(jsonApiResourceAttributes && Object.keys(jsonApiResourceAttributes) || []),
    ...(jsonApiResourceRelationships && Object.keys(jsonApiResourceRelationships) || []),
    ...(jsonApiResourceId && ['id'] || [])
  ]

};

export const useFieldsForOperation = (
  operationId: string,
  ignore_id = true,
): FieldDefinition[] => {
  const {schema} = useResourceSchema(operationId)
  const allFields = useMemo(()=> schema && (ignore_id ? encapsulateFields(schema).filter(name => name !== 'id'): encapsulateFields(schema)) || [], [schema])
  const fieldSchemas = useMemo<FieldSchema[]>(()=> schema && allFields.map(name => getFieldSchema(name, schema)).filter(schema => schema !== undefined) || [], [schema, allFields])

  return fieldSchemas.map(fieldSchema => fieldSchema && getFieldDefinition(fieldSchema)).filter(fieldDefinition => fieldDefinition !== undefined)
}