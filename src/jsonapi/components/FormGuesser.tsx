import { type ReactNode, useContext, useEffect, useState } from 'react'
import { Edit, type EditProps, SimpleForm, useRecordContext, useResourceDefinition } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import HttpClientContext from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../../openapi/parser'
import inputGuesser from '../openapi/inputGuesser'

const EditGuesser = (props: EditProps) => {
  const { name, options } = useResourceDefinition()
  const record = useRecordContext(props)

  const httpClient = useContext(HttpClientContext)
  const [fields, setFields] = useState<ReactNode[]>()

  useEffect(() => {
    if (name !== '') {
      httpClient
        .then((client) => client.api.getOperation(`partial_update_${name}`))
        .then((operation) => getEncapsulatedSchema(operation))

        .then((schema) => {
          const _fields: ReactNode[] = []

          const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>

          const requiredFields = schema?.required ?? []
          const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as Record<string, OpenAPIV3.NonArraySchemaObject>
          _fields.push(inputGuesser('id', jsonApiResourceId, requiredFields.includes('id') ?? false, record))

          const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties as OpenAPIV3.NonArraySchemaObject
          Object.entries(jsonApiResourceAttributes).forEach(([name, schema]) => {
            const isRequired = jsonApiPrimaryDataProperties?.attributes?.required?.includes(name) ?? false
            _fields.push(inputGuesser(name, schema, isRequired, record))
          })

          // TODO:
          const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships

          return _fields
        })
        .then((_fields) => { setFields(_fields) })
    }
  }, [name, httpClient])

  const jsonApiType = options?.type

  const onError = (error) => {
    // TODO: handle jsonapi errors
  }

  return (
    <Edit
      {...props}
      queryOptions={{ refetchOnReconnect: true }}
      mutationOptions={{ onError, meta: { type: jsonApiType } }}
      mutationMode='pessimistic'
    >
      <SimpleForm>
        {fields}
      </SimpleForm>
    </Edit>
  )
}

export default EditGuesser
