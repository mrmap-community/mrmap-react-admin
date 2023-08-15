import type { Identifier, RaRecord } from 'react-admin'

import { type OpenAPIV3, type Operation } from 'openapi-client-axios'

import { getEncapsulatedSchema } from '../openapi/parser'
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

  for (const [relationName, resourceLinkageSchema] of Object.entries(jsonApiResourceRelationships)) {
    if (relationName in attributes) {
      // need to capsulate data of relationship as well
      const relationData = attributes[relationName]
      const isList = Object.prototype.hasOwnProperty.call(resourceLinkageSchema.properties.data, 'items')
      const relationSchema = isList ? resourceLinkageSchema?.properties?.data?.items as OpenAPIV3.NonArraySchemaObject : resourceLinkageSchema.properties.data as OpenAPIV3.NonArraySchemaObject
      const relationResourceType = relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject

      if (isList) {
        const newData: ResourceIdentifierObject[] = []
        relationData.forEach((id: Identifier) => newData.push({ id, type: relationResourceType?.enum?.[0] }))
        relationships[relationName] = { data: newData }
      } else {
        relationships[relationName] = { data: { id, type: relationResourceType?.enum?.[0] } }
      }
      delete attributes.relationName
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
// concrete the return value; it should be `ApiPlatformAdminRecord`
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
