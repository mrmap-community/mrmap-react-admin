import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useLocalStorage } from "@uidotdev/usehooks";
import { AxiosHeaders, AxiosRequestConfig } from 'axios';
import { isEqual } from 'lodash';
import OpenAPIClientAxios, { OpenAPIV3, OpenAPIV3_1 } from 'openapi-client-axios';

import { JsonApiMimeType } from '../jsonapi/types/jsonapi';
import { AuthToken } from '../providers/authProvider';

export interface HttpClientContextType {
  api?: OpenAPIClientAxios
  authToken: AuthToken | undefined
  setAuthToken: (authToken: AuthToken | undefined) => void
}

export const AUTH_TOKEN_LOCAL_STORAGE_NAME = "mrmap.auth.token"
const AXIOS_DEFAULTS = {
  baseURL: "http://localhost:8001",  
  headers: new AxiosHeaders(
    {
      Accept: JsonApiMimeType,
      'Content-Type': JsonApiMimeType,
    }
  )
}

export const HttpClientContext = createContext<HttpClientContextType|undefined>(undefined)


export const HttpClientBase = ({ children }: any): ReactNode => {
  const [storedAuthToken, setStoredAuthToken] = useLocalStorage<AuthToken| undefined>(AUTH_TOKEN_LOCAL_STORAGE_NAME, undefined);
  const [authToken, setAuthToken] = useState<AuthToken| undefined>(undefined);

  const [api, setApi] = useState<OpenAPIClientAxios>()
  const [document, setDocument] = useState<OpenAPIV3.Document | OpenAPIV3_1.Document>()
  
  const defaultConf = useMemo<AxiosRequestConfig>(()=>{
    const conf = {...AXIOS_DEFAULTS}
    authToken?.token && conf?.headers?.setAuthorization(`Token ${authToken?.token}`)
    return conf
  }, [authToken])

  // we need to memo the localstorage value by our self.... see issu: https://github.com/uidotdev/usehooks/pull/304
  useEffect(()=>{
    if (isEqual(authToken, storedAuthToken) === false){
      setAuthToken(storedAuthToken)
    }
  },[storedAuthToken])

  useEffect(() => {
    if (document === undefined) {     
      const httpClient = new OpenAPIClientAxios({ definition: 'http://localhost:8001/api/schema'})
      httpClient.init().then((client) => {
        setDocument(client.api.document)
      }).catch((error) => { console.error("errror during initialize axios openapi client", error)})
    }
  }, [document])

  useEffect(()=>{
    if (document !== undefined){
      new OpenAPIClientAxios({ definition: document, axiosConfigDefaults: defaultConf})
      .init()
      .then((client) => {
          setApi(client.api)
      })
      .catch((error) => { console.error("errror during initialize axios openapi client", error)})
    }
  },[document, defaultConf])

  const value = useMemo(()=>{
    const v = { 
      api: api, 
      authToken: authToken, 
      setAuthToken: setStoredAuthToken
    }
    return v
  }, [api, authToken, setStoredAuthToken])

  return (
    <HttpClientContext.Provider value={value}>
      {children}
    </HttpClientContext.Provider>
  )
}

export const  useHttpClientContext = (): HttpClientContextType => {
  const context = useContext(HttpClientContext)
  if (context === undefined) {
    throw new Error('HttpClientContext must be inside a HttpClientBase')
  }
  return context
}
