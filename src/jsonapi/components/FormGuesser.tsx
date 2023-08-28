import { type ReactElement, useContext, useEffect, useMemo, useState } from 'react'
import { Create, type CreateProps, Edit, type EditProps, type RaRecord, SimpleForm, useRecordContext, useResourceDefinition } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import { HttpClientContext } from '../../context/HttpClientContext'
import useOperationSchema from '../hooks/useOperationSchema'
import inputGuesser from '../openapi/inputGuesser'
import RelationInputGuesser from './RelationInputGuesser'

const getFieldsForOperation = (schema: OpenAPIV3.NonArraySchemaObject, record?: RaRecord): ReactElement[] => {
  const fields: ReactElement[] = []
  if (schema !== undefined) {
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
      fields.push(RelationInputGuesser(name, schema, isRequired, record))
    })
  }
  return fields
}

export const EditGuesser = (
  props: EditProps
): ReactElement => {
  const { name, options } = useResourceDefinition()
  const record = useRecordContext()

  const [operationId, setOperationId] = useState('')
  const { schema } = useOperationSchema(operationId)

  const fields = useMemo(() => (schema !== undefined) ? getFieldsForOperation(schema, record) : [], [schema, record])

  useEffect(() => {
    if (name !== undefined) {
      setOperationId(`partial_update_${name}`)
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
  const [fields, setFields] = useState<ReactElement[]>()

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
      redirect="list" // default is edit... but this is not possible on async created resources
      mutationOptions={{ onError, meta: { type: options?.type } }}
    >
      <SimpleForm>
        {fields}
      </SimpleForm>
    </Create>
  )
}
