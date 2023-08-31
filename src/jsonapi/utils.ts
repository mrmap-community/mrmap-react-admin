import { type ReactElement } from 'react'
import type { Identifier, RaRecord } from 'react-admin'

import { type OpenAPIV3, type Operation, type ParameterObject } from 'openapi-client-axios'

import RelationInputGuesser from './components/RelationInputGuesser'
import inputGuesser from './openapi/inputGuesser'
import { getEncapsulatedSchema } from './openapi/parser'
import { type JsonApiDocument, type JsonApiPrimaryData, type ResourceIdentifierObject, type ResourceLinkage } from './types/jsonapi'

export const capsulateJsonApiPrimaryData = (data: RaRecord, type: string, operation: Operation): JsonApiPrimaryData => {
  /** helper to transform react admin data to json:api conform primary data object
     *
     */
  const { id, ...attributes } = data
  const relationships: Record<string, ResourceLinkage> = {}

  const resourceSchema = getEncapsulatedSchema(operation)

  const jsonApiPrimaryDataProperties = resourceSchema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
  const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties as OpenAPIV3.NonArraySchemaObject
  for (const [relationName, resourceLinkageSchema] of Object.entries(jsonApiResourceRelationships ?? {})) {
    if (relationName in attributes) {
      // need to capsulate data of relationship as well
      const isList = Object.prototype.hasOwnProperty.call(resourceLinkageSchema.properties.data, 'items')
      const relationSchema = isList ? resourceLinkageSchema?.properties?.data?.items as OpenAPIV3.NonArraySchemaObject : resourceLinkageSchema.properties.data as OpenAPIV3.NonArraySchemaObject
      const relationResourceType = relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject

      if (isList) {
        const newData: ResourceIdentifierObject[] = []
        const relationData: RaRecord[] = attributes[relationName]

        relationData.forEach((record: RaRecord) => newData.push({ id: record.id, type: relationResourceType?.enum?.[0] }))
        relationships[relationName] = { data: newData }
      } else {
        const relationData: RaRecord = attributes[relationName]
        if (relationData !== undefined) {
          relationships[relationName] = { data: { id: relationData.id, type: relationResourceType?.enum?.[0] } }
        }
      }
      // TODO: delete attributes.relationName does not work
      delete attributes[relationName]
    }
  }

  const primaryData: JsonApiPrimaryData = {
    id,
    type,
    attributes,
    relationships
  }
  return primaryData
}

export const findIncludedData = (document: JsonApiDocument, resourceIdentifierObject: ResourceIdentifierObject): JsonApiPrimaryData => {
  /** Searches for included object and returns it insted of the ResourceIdentifierObject */
  const founded = document.included?.find((data: JsonApiPrimaryData) => data.id === resourceIdentifierObject.id && data.type === resourceIdentifierObject.type)
  const returnVal = founded ?? resourceIdentifierObject as JsonApiPrimaryData
  return returnVal
}
// concrete the return value;
export const encapsulateJsonApiPrimaryData = (document: JsonApiDocument, data: JsonApiPrimaryData): any => {
  /** helper to transform json:api primary data object to react admin record
     *
     */

  const relationships: any = {}

  if ((data?.relationships) != null) {
    for (const [relationName, resourceLinkage] of Object.entries(data.relationships)) {
      if (Array.isArray(resourceLinkage.data)) {
        const relatedObjects: any[] = []
        resourceLinkage.data.forEach(resourceIdentifierObject => {
          relatedObjects.push(
            encapsulateJsonApiPrimaryData(
              document,
              findIncludedData(document, resourceIdentifierObject)
            )
          )
        })
        relationships[`${relationName}`] = relatedObjects
      } else {
        relationships[`${relationName}`] = (resourceLinkage.data != null)
          ? encapsulateJsonApiPrimaryData(
            document,
            findIncludedData(document, resourceLinkage.data)
          )
          : undefined
      }
    }
  }

  return {
    id: data.id,
    ...data.attributes,
    ...relationships
  }
}

export const getIncludeOptions = (operation: Operation): string[] => {
  if (operation !== undefined) {
    const parameters = operation.parameters as ParameterObject[]
    const includeParameterSchema = parameters?.find((parameter) => parameter.name.includes('include'))?.schema as OpenAPIV3.ArraySchemaObject
    const includeParameterArraySchema = includeParameterSchema?.items as OpenAPIV3.SchemaObject
    return includeParameterArraySchema?.enum ?? []
  }
  return []
}

export const getSparseFieldOptions = (operation: Operation): string[] => {
  if (operation !== undefined) {
    const parameters = operation.parameters as ParameterObject[]
    const includeParameterSchema = parameters?.find((parameter) => parameter.name.includes('fields['))?.schema as OpenAPIV3.ArraySchemaObject
    const includeParameterArraySchema = includeParameterSchema.items as OpenAPIV3.SchemaObject
    return includeParameterArraySchema.enum ?? []
  }
  return []
}

export const getFieldsForOperation = (schema: OpenAPIV3.NonArraySchemaObject, record?: RaRecord): ReactElement[] => {
  const fields: ReactElement[] = []
  if (schema !== undefined) {
    const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>

    const requiredFields = schema?.required ?? []
    const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as Record<string, OpenAPIV3.NonArraySchemaObject>
    if (jsonApiResourceId !== undefined) {
      // on create operations there is no id
      fields.push(inputGuesser('id', jsonApiResourceId, requiredFields.includes('id') ?? false, record))
    }
    const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties as OpenAPIV3.NonArraySchemaObject

    Object.entries(jsonApiResourceAttributes ?? {}).forEach(([name, schema]) => {
      const isRequired = jsonApiPrimaryDataProperties?.attributes?.required?.includes(name) ?? false
      fields.push(inputGuesser(name, schema, isRequired, record))
    })

    const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties as OpenAPIV3.NonArraySchemaObject
    Object.entries(jsonApiResourceRelationships ?? {}).forEach(([name, schema]) => {
      const isRequired = jsonApiPrimaryDataProperties?.relationships?.required?.includes(name) ?? false
      fields.push(RelationInputGuesser(name, schema, isRequired, record))
    })
  }
  return fields
}

export const hasIncludedData = (record: RaRecord): boolean => (Object.entries(record).find(([name, schema]) => name !== 'id') != null)
