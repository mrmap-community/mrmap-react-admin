import { useContext, useEffect, useState } from 'react'

import { type OpenAPIV3, type Operation } from 'openapi-client-axios'

import { HttpClientContext } from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../openapi/parser'

export interface OperationSchema {
  schemas?: OpenAPIV3.NonArraySchemaObject[]
  operations?: Operation[]
}

const useGetRelatedOperationSchemas = (resource: string, related: string): OperationSchema => {
  const { client } = useContext(HttpClientContext)
  const [schemas, setSchemas] = useState<OpenAPIV3.NonArraySchemaObject[]>()
  const [operations, setOperations] = useState<Operation[]>()

  useEffect(() => {
    if (resource !== undefined && resource !== '' && client !== undefined) {
      const _operations = client.api.getOperations().filter((operation) => ((operation.operationId?.includes(`list_related_${related}`)) ?? false) && operation.operationId?.includes(`_of_${resource}`))
      if (_operations === undefined) {
        return
      }
      const encapsulatedSchemas = _operations.map((operation) => getEncapsulatedSchema(operation))
      setOperations(_operations)
      setSchemas(encapsulatedSchemas)
    }
  }, [resource, client])

  return { schemas, operations }
}

export default useGetRelatedOperationSchemas
