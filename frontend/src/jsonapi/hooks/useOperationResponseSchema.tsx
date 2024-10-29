import { useEffect, useState } from 'react'

import { type OpenAPIV3, type Operation } from 'openapi-client-axios'

import { useHttpClientContext } from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../openapi/parser'
import useOperation from './useOperation'

export interface OperationSchema {
  schema?: OpenAPIV3.NonArraySchemaObject
  operation?: Operation
}

const useOperationResponseSchema = (operationId: string): OperationSchema => {
  const { api: client } = useHttpClientContext()
  const [schema, setSchema] = useState<OpenAPIV3.NonArraySchemaObject>()

  const operation = useOperation(operationId)

  useEffect(() => {
    if (operation && client !== undefined) {
      const _operation = client.client.api.getOperation(operationId)
      if (_operation === undefined) {
        setSchema(undefined)
        return
      }
      const encapsulatedSchema = getEncapsulatedSchema(_operation)
      setSchema({ ...encapsulatedSchema })
    }
  }, [operation, client])

  return { schema, operation }
}

export default useOperationResponseSchema
