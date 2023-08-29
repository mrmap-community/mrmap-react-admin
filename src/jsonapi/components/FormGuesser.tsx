import { type ReactElement, useMemo } from 'react'
import { Create, type CreateProps, Edit, type EditProps, SimpleForm, useRecordContext, useResourceDefinition } from 'react-admin'

import { snakeCase } from 'lodash'

import useOperationSchema from '../hooks/useOperationSchema'
import { getFieldsForOperation, getIncludeOptions, getSparseFieldOptions } from '../utils'

export const EditGuesser = (
  props: EditProps
): ReactElement => {
  const { name, options } = useResourceDefinition()
  const record = useRecordContext()

  const editOperationId = useMemo(() => (name !== undefined) ? `partial_update_${name}` : '', [name])
  const showOperationId = useMemo(() => (name !== undefined) ? `retrieve_${name}` : '', [name])

  const { schema: editSchema, operation: editOperation } = useOperationSchema(editOperationId)
  const { schema: showSchema, operation: showOperation } = useOperationSchema(showOperationId)

  const fields = useMemo(() => (editSchema !== undefined) ? getFieldsForOperation(editSchema, record) : [], [editSchema, record])
  const includeOptions = useMemo(() => (showOperation !== undefined) ? getIncludeOptions(showOperation) : [], [showOperation])
  const sparseFieldOptions = useMemo(() => (showOperation !== undefined) ? getSparseFieldOptions(showOperation) : [], [showOperation])

  const sparseFieldsQueryValue = useMemo(
    () => fields.filter(field => sparseFieldOptions.includes(field.props.source)).map(field =>
      // TODO: django jsonapi has an open issue where no snake to cammel case translation are made
      // See https://github.com/django-json-api/django-rest-framework-json-api/issues/1053
      snakeCase(field.props.source)
    )
    , [sparseFieldOptions, fields]
  )

  const includeQueryValue = useMemo(
    () => includeOptions.filter(includeOption => sparseFieldsQueryValue.includes(includeOption))
    , [sparseFieldsQueryValue, includeOptions]
  )

  const jsonApiQuery = useMemo(
    () => {
      const query: any = {}

      if (sparseFieldsQueryValue !== undefined) {
        query[`fields[${name}]`] = sparseFieldsQueryValue.join(',')
      }
      if (includeQueryValue !== undefined) {
        query.include = includeQueryValue.join(',')
      }

      return query
    }
    , [sparseFieldsQueryValue, includeQueryValue]
  )

  const onError = (error) => {
    // TODO: handle jsonapi errors
  }

  return (
    <Edit
      queryOptions={{
        refetchOnReconnect: true,
        meta: {
          jsonApiParams: { ...jsonApiQuery }
        }
      }}
      mutationOptions={{ onError, meta: { type: options?.type } }}
      mutationMode='pessimistic'
      {...props}
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
  const createOperationId = useMemo(() => (name !== undefined) ? `create_${name}` : '', [name])
  const { schema } = useOperationSchema(createOperationId)

  const fields = useMemo(() => (schema !== undefined) ? getFieldsForOperation(schema) : [], [schema])

  const onError = (error) => {
    // TODO: handle jsonapi errors
    // handle error messages from backend like json pointer to a specific field for helptexting
  }

  return (
    <Create
      redirect="list" // default is edit... but this is not possible on async created resources
      mutationOptions={{ onError, meta: { type: options?.type } }}
      {...props}
    >
      <SimpleForm>
        {fields}
      </SimpleForm>
    </Create>
  )
}
