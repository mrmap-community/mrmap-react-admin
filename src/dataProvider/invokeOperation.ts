import {OpenAPIClient} from "openapi-client-axios";




export interface InvokeOperationProps {
    resolveClient: Promise<OpenAPIClient>; // TODO: concrete type
    operationId: string;
    parameters: any // TODO: concrete type
    apiUrl?: string;
};



export function invokeOperation({ resolveClient, operationId, parameters, apiUrl = "" }: InvokeOperationProps) {
  console.log("operationId", operationId);  
  console.log("client",resolveClient);
  console.log("apiUrl", apiUrl)
  

  return resolveClient.then((client) => {
    
    const operation = client.api.getOperation(operationId);
    console.log("operation", operation);
    const baseUrl = client.api.getBaseURL(operation)

    const url = apiUrl + operation?.path ?? operation?.path;
    console.log(url)
    return client.get(
      url, 
      {
        method: operation?.method,
        params: parameters
      }
    )
  
  })
  
  
}