



export interface InvokeOperationProps {
    resolveClient: any; // TODO: concrete type
    operationId: string;
    parameters: any // TODO: concrete type
};



export function invokeOperation({ resolveClient, operationId, parameters }: InvokeOperationProps) {
    return resolveClient.then((client: any) =>
      client
        .execute({ operationId, parameters })
        .then(({ data }) => new Response(data).text())
        .then((data) => ({ data: JSON.parse(data) }))
    );
  }
  