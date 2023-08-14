import OpenAPIClientAxios from "openapi-client-axios";
import { createContext } from "react";


// TODO: make definition url configurable
const httpClient = new OpenAPIClientAxios({ definition: "http://localhost:8001/api/schema" }).init()
const HttpClientContext = createContext(httpClient);


export default HttpClientContext