import { createContext, type ReactNode, useEffect, useState } from 'react'

import OpenAPIClientAxios, { type OpenAPIClient, type UnknownOperationMethods, type UnknownPathsDictionary } from 'openapi-client-axios'

export interface HttpClientContextType {
  client?: OpenAPIClient<UnknownOperationMethods, UnknownPathsDictionary>
  isLoading: boolean
}

const init: HttpClientContextType = {
  client: undefined,
  isLoading: true
}

export const HttpClientContext = createContext(init)

export const HttpClientProvider = ({ children }: any): ReactNode => {
  const [client, setClient] = useState<any>()
  const [isLoading, setLoading] = useState<any>()

  useEffect(() => {
    console.log('context effect called')
    if (client === undefined && isLoading === undefined) {
      console.log('callGetClient')
      setLoading(true)

      const httpClient = new OpenAPIClientAxios({ definition: 'http://localhost:8001/api/schema' })
      httpClient.init().then((client) => {
        setClient({ ...client })
        setLoading(false)
      }).catch(() => { })
      return () => { }
    }
    console.log('stored client', client)
  }, [client])

  return (
    <HttpClientContext.Provider value={{ client, isLoading }}>
      {children}
    </HttpClientContext.Provider>
  )
}
