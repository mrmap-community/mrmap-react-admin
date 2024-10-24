import { useEffect, useState } from 'react'

import { type OpenAPIV3, type Operation } from 'openapi-client-axios'

import { useHttpClientContext } from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../openapi/parser'

export interface OperationSchema {
  schema?: OpenAPIV3.NonArraySchemaObject
  operation?: Operation
}

const useOperationSchema = (operationId: string): OperationSchema => {
  const { api: client } = useHttpClientContext()
  const [schema, setSchema] = useState<OpenAPIV3.NonArraySchemaObject>()
  const [operation, setOperation] = useState<Operation>()

  useEffect(() => {
    if (operationId !== undefined && operationId !== '' && client !== undefined) {
      const _operation = client.client.api.getOperation(operationId)
      if (_operation === undefined) {
        setOperation(undefined)
        setSchema(undefined)
        return
      }
      const encapsulatedSchema = getEncapsulatedSchema(_operation)
      setOperation(_operation)
      setSchema({ ...encapsulatedSchema })
    }
  }, [operationId, client])

  return { schema, operation }
}

export default useOperationSchema
