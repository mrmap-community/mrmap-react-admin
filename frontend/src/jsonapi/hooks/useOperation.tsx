import { useEffect, useState } from 'react'

import { type Operation } from 'openapi-client-axios'

import { useHttpClientContext } from '../../context/HttpClientContext'


const useOperation = (operationId: string): Operation | undefined => {
  const { api: client } = useHttpClientContext()
  const [operation, setOperation] = useState<Operation>()

  useEffect(() => {
    if (operationId !== undefined && operationId !== '' && client !== undefined) {
      const _operation = client.client.api.getOperation(operationId)
      if (_operation === undefined) {
        setOperation(undefined)
        return
      }
      setOperation(_operation)
    }
  }, [operationId, client])

  return operation
}

export default useOperation
