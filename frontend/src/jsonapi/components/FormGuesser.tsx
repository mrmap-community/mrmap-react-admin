import { snakeCase } from 'lodash';
import { type ReactElement, useMemo } from 'react';
import { Create, type CreateProps, Edit, type EditProps, Loading, RaRecord, SaveButton, SimpleForm, Toolbar, useRecordContext, useResourceDefinition } from 'react-admin';

import useOperationSchema from '../hooks/useOperationSchema';
import { getFieldsForOperation, getIncludeOptions, getSparseFieldOptions } from '../utils';

interface EditGuesserProps<RecordType extends RaRecord = any>
    extends Omit<EditProps<RecordType>, 'children'> {}

export const EditGuesser = (
  props: EditGuesserProps
): ReactElement => {
  const { name, options } = useResourceDefinition(props)
  const record = useRecordContext(props)

  const editOperationId = useMemo(() => (name !== undefined) ? `partial_update_${name}` : '', [name])
  const showOperationId = useMemo(() => (name !== undefined) ? `retrieve_${name}` : '', [name])

  const { schema: editSchema } = useOperationSchema(editOperationId)
  const { operation: showOperation } = useOperationSchema(showOperationId)

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



  if (Object.keys(jsonApiQuery).length === 0 || fields.length === 0) {
    return <Loading />
  }

  return (
    <Edit
      queryOptions={{
        refetchOnReconnect: true,
        meta: {
          jsonApiParams: { ...jsonApiQuery }
        }
      }}
      mutationOptions={{ meta: { type: options?.type }}}
      mutationMode='pessimistic'
      
      {...props}
    >
      <SimpleForm
        
        sanitizeEmptyValues
      >
        {fields}
      </SimpleForm>
    </Edit>
  )
}

export const CreateToolbar = () => (
  // To support initialize all fields we need to set alwaysEnable to true
  // see https://github.com/marmelab/react-admin/issues/5796
  <Toolbar>
      <SaveButton alwaysEnable />
  </Toolbar>
);


export const CreateGuesser = (
  {
    mutationOptions,
    ...rest
  }: CreateProps
): ReactElement => {

  const { name, options } = useResourceDefinition({ resource: rest.resource })
  const createOperationId = useMemo(() => (name !== undefined) ? `create_${name}` : '', [name])
  const { schema } = useOperationSchema(createOperationId)
  const fields = useMemo(() => (schema !== undefined) ? getFieldsForOperation(schema) : [], [schema])

  // be clear that json:api type is always part of mutationOptions so that the dataprovider has all information he needs
  const _mutationOptions = useMemo(() => {
    return (mutationOptions != null) ? { ...mutationOptions, meta: { type: options?.type } } : { meta: { type: options?.type } }
  }, [mutationOptions])


  return (
    <Create
      redirect="list" // default is edit... but this is not possible on async created resources
      mutationOptions={_mutationOptions}
      {...rest}
    >
      <SimpleForm
      toolbar={<CreateToolbar/>}>
        {fields}
      </SimpleForm>
    </Create>
  )
}
