import { createContext } from 'react'

import OpenAPIClientAxios from 'openapi-client-axios'

// TODO: make definition url configurable
const httpClient = new OpenAPIClientAxios({ definition: 'http://localhost:8001/api/schema' }).init()

const HttpClientContext = createContext(httpClient)

export default HttpClientContext
