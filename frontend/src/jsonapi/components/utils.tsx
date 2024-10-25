import { type OpenAPIV3 } from 'openapi-client-axios'

const getRecordRepresentation = (schema: OpenAPIV3.NonArraySchemaObject): string => {
  let optionText = 'id'

  const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes?.properties as OpenAPIV3.NonArraySchemaObject
  // TODO: change the check to a simpler way
  if (jsonApiResourceAttributes !== undefined) {
    if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'stringRepresentation') != null) {
      optionText = 'stringRepresentation'
    } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'title') != null) {
      optionText = 'title'
    } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'name') != null) {
      optionText = 'name'
    }
  }

  return optionText
}

export default getRecordRepresentation
