import { useEffect, useState } from 'react'
import { useResourceDefinition } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import useOperationSchema from './useOperationSchema'

const getRecordRepresentationFromSchema = (schema: OpenAPIV3.NonArraySchemaObject): string => {
  let recordRepresentation = 'id'

  const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes?.properties as OpenAPIV3.NonArraySchemaObject
  // TODO: change the check to a simpler way
  if (jsonApiResourceAttributes !== undefined) {
    if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'stringRepresentation') != null) {
      recordRepresentation = 'stringRepresentation'
    } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'title') != null) {
      recordRepresentation = 'title'
    } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'name') != null) {
      recordRepresentation = 'name'
    }
  }

  return recordRepresentation
}

const useSchemaRecordRepresentation = (
  operationId?: string
): string => {
  const { name } = useResourceDefinition()
  const { schema } = useOperationSchema(operationId ?? `list_${name}`)
  console.log('schema', schema, 'for', name, operationId)
  const [representation, setRepresentation] = useState<string>('id')

  useEffect(() => {
    if (schema !== undefined) {
      setRepresentation(getRecordRepresentationFromSchema(schema))
    }
  }, [schema])
  return representation
}

export default useSchemaRecordRepresentation
