import { useState, useEffect, useContext } from 'react';
import { HttpClientContext } from '../../context/HttpClientContext';
import { getEncapsulatedSchema } from '../../openapi/parser';
import { OpenAPIV3, Operation } from 'openapi-client-axios';



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

    return { schema, operation };
}

export default useOperationSchema