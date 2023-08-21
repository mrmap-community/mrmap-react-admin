import { useContext, useEffect, useState } from 'react'

import { type OpenAPIV3, type Operation } from 'openapi-client-axios'

import { HttpClientContext } from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../../openapi/parser'

const useOperationSchema = (operationId: string) => {
  const { client } = useContext(HttpClientContext)

  const [schema, setSchema] = useState<OpenAPIV3.NonArraySchemaObject>()
  const [operation, setOperation] = useState<Operation>()
  useEffect(() => {
    if (client !== undefined) {
      const _operation = client.api.getOperation(operationId)
      const encapsulatedSchema = getEncapsulatedSchema(operation)

      setOperation(_operation)
      setSchema({ ...encapsulatedSchema })
    }
  }, [client])

  return { schema, operation }
}

export default useOperationSchema
