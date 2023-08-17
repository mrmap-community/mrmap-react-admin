import { type ReactElement, type ReactNode, useContext, useEffect, useState } from 'react'
import { Create, type CreateProps, Edit, type EditProps, type RaRecord, SimpleForm, useRecordContext, useResourceDefinition } from 'react-admin'

import { type OpenAPIClient, type OpenAPIV3, type UnknownOperationMethods, type UnknownPathsDictionary } from 'openapi-client-axios'

import { HttpClientContext } from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../../openapi/parser'
import inputGuesser from '../openapi/inputGuesser'
import relationInputGuesser from '../openapi/relationInputGuesser'

const getFieldsForOperation = (openapiClient: OpenAPIClient<UnknownOperationMethods, UnknownPathsDictionary>, operationId: string, record?: RaRecord): ReactNode[] => {
  const fields: ReactNode[] = []

  const operation = openapiClient.api.getOperation(operationId)
  const schema = getEncapsulatedSchema(operation)

  const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>

  const requiredFields = schema?.required ?? []
  const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as Record<string, OpenAPIV3.NonArraySchemaObject>
  if (jsonApiResourceId !== undefined) {
    // on create operations there is no id
    fields.push(inputGuesser('id', jsonApiResourceId, requiredFields.includes('id') ?? false, record))
  }
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties as OpenAPIV3.NonArraySchemaObject

  Object.entries(jsonApiResourceAttributes).forEach(([name, schema]) => {
    const isRequired = jsonApiPrimaryDataProperties?.attributes?.required?.includes(name) ?? false
    fields.push(inputGuesser(name, schema, isRequired, record))
  })

  const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties as OpenAPIV3.NonArraySchemaObject
  Object.entries(jsonApiResourceRelationships).forEach(([name, schema]) => {
    const isRequired = jsonApiPrimaryDataProperties?.relationships?.required?.includes(name) ?? false
    fields.push(relationInputGuesser(name, schema, isRequired, record))
  })

  return fields
}

export const EditGuesser = (
  props: EditProps
): ReactElement => {
  const { name, options } = useResourceDefinition()
  const record = useRecordContext(props)

  const { client } = useContext(HttpClientContext)
  const [fields, setFields] = useState<ReactNode[]>()

  useEffect(() => {
    if ((fields === undefined || fields.length === 0) && name !== '' && name !== undefined && client !== undefined) {
      const _getFieldsForOperation = async (): Promise<void> => {
        setFields(getFieldsForOperation(client, `partial_update_${name}`, record))
      }
      _getFieldsForOperation().catch(console.error)
    }
  }, [name])

  const onError = (error) => {
    // TODO: handle jsonapi errors
  }

  return (
    <Edit
      {...props}
      queryOptions={{ refetchOnReconnect: true }}
      mutationOptions={{ onError, meta: { type: options?.type } }}
      mutationMode='pessimistic'
    >
      <SimpleForm>
        {fields}
      </SimpleForm>
    </Edit>
  )
}

export const CreateGuesser = (
  props: CreateProps
): ReactElement => {
  const { name, options } = useResourceDefinition()
  const { client } = useContext(HttpClientContext)
  const [fields, setFields] = useState<ReactNode[]>()

  useEffect(() => {
    if ((fields === undefined || fields.length === 0) && name !== '' && name !== undefined && client !== undefined) {
      const _getFieldsForOperation = async (): Promise<void> => {
        setFields(getFieldsForOperation(client, `create_${name}`))
      }
      _getFieldsForOperation().catch(console.error)
    }
  }, [name])

  const onError = (error) => {
    // TODO: handle jsonapi errors
    // handle error messages from backend like json pointer to a specific field for helptexting
  }

  return (
    <Create
      {...props}
      mutationOptions={{ onError, meta: { type: options?.type } }}
    >
      <SimpleForm>
        {fields}
      </SimpleForm>
    </Create>
  )
}
