import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { DatagridConfigurable, EditButton, List, type ListProps, ShowButton, useResourceContext, useResourceDefinition, useStore } from 'react-admin'
import { useSearchParams } from 'react-router-dom'

import { type OpenAPIV3, type Operation, type ParameterObject } from 'openapi-client-axios'

import useOperationSchema from '../hooks/useOperationSchema'
import fieldGuesser from '../openapi/fieldGuesser'
import { type JsonApiDocument, type JsonApiErrorObject } from '../types/jsonapi'
import FilterGuesser from './FilterGuesser'
const isInvalidSort = (error: JsonApiErrorObject): boolean => {
  if (error.code === 'invalid' && error.detail.includes('sort parameter')) {
    return true
  }
  return false
}

interface FieldWrapperProps {
  children: ReactNode[]
  label: string
}

const FieldWrapper = ({ children, label }: FieldWrapperProps): ReactNode => children

const getFieldsForSchema = (schema: OpenAPIV3.NonArraySchemaObject, operation: Operation): ReactNode[] => {
  const fields: ReactNode[] = []
  if (schema !== undefined && operation !== undefined) {
    const parameters = operation?.parameters as ParameterObject[]
    const sortParameterSchema = parameters?.find((parameter) => parameter.name === 'sort')?.schema as OpenAPIV3.ArraySchemaObject
    const sortParameterItemsSchema = sortParameterSchema?.items as OpenAPIV3.SchemaObject
    const sortParameterValues = sortParameterItemsSchema?.enum?.filter((value) => value.includes('-') === false)

    const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
    const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes?.properties as OpenAPIV3.NonArraySchemaObject
    const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties as OpenAPIV3.NonArraySchemaObject

    Object.entries({ id: jsonApiPrimaryDataProperties?.id, ...jsonApiResourceAttributes ?? {}, ...jsonApiResourceRelationships ?? {} }).forEach(([name, schema]) => {
      const isSortable = sortParameterValues?.includes(name)
      fields.push(fieldGuesser(name, schema, isSortable))
    })
  }
  return fields
}

const getIncludeOptions = (operation: Operation): string[] => {
  if (operation !== undefined) {
    const parameters = operation.parameters as ParameterObject[]
    const includeParameterSchema = parameters?.find((parameter) => parameter.name.includes('include'))?.schema as OpenAPIV3.ArraySchemaObject
    const includeParameterArraySchema = includeParameterSchema.items as OpenAPIV3.SchemaObject
    return includeParameterArraySchema.enum ?? []
  }
  return []
}

const getSparseFieldOptions = (operation: Operation): string[] => {
  if (operation !== undefined) {
    const parameters = operation.parameters as ParameterObject[]
    const includeParameterSchema = parameters?.find((parameter) => parameter.name.includes('fields['))?.schema as OpenAPIV3.ArraySchemaObject
    const includeParameterArraySchema = includeParameterSchema.items as OpenAPIV3.SchemaObject
    return includeParameterArraySchema.enum ?? []
  }
  return []
}

const ListGuesser = ({
  ...props
}: ListProps): ReactElement => {
  const { name, hasShow, hasEdit } = useResourceDefinition(props)
  const resource = useResourceContext()

  const [operationId, setOperationId] = useState('')
  const { schema, operation } = useOperationSchema(operationId)
  const fields = useMemo(() => (schema !== undefined && operation !== undefined) ? getFieldsForSchema(schema, operation) : [], [schema, operation])

  const includeOptions = useMemo(() => (operation !== undefined) ? getIncludeOptions(operation) : [], [operation])
  const sparseFieldOptions = useMemo(() => (operation !== undefined) ? getSparseFieldOptions(operation) : [], [operation])

  const [listParams, setListParams] = useStore(`${resource}.listParams`)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (name !== undefined) {
      setOperationId(`list_${name}`)
    }
  }, [name])

  const onError = useCallback((error: any): void => {
    /** Custom error handler for jsonApi bad request response
     *
     * possible if:
     *   - attribute is not sortable
     *   - attribute is not filterable
     *   - wrong sparseField
     *   - wrong include option
     *
    */
    if (error?.status === 400) {
      const jsonApiDocument: JsonApiDocument = error.body

      jsonApiDocument.errors?.forEach((apiError: JsonApiErrorObject) => {
        if (isInvalidSort(apiError)) {
          // remove sort from storage
          const newParams = listParams
          newParams.sort = ''
          setListParams(newParams)

          // remove sort from current location
          searchParams.delete('sort')
          setSearchParams(searchParams)
        }
      })
    } else if (error.status === 401) {
      // TODO
    } else if (error.status === 403) {
      // TODO
    }
  }, [])

  if (fields === undefined || fields?.length === 0) {
    // if fields are empty the table will be initial rendered only with the default index column.
    // when fields are filled after that render cyclus, the datagrid will be stuck with this single column
    // untill a new full render cyclus becomes started for the datagrid. (for example page change)
    return <div />
  }

  return (
    <List
      filters={<FilterGuesser />}
      queryOptions={{
        onError
        // TODO: calculate includes on the fly based on the schema
        // meta: { include: 'keywords' }
      }}

      {...props}
    >

      {/* rowClick='edit' only if the resource provide edit operations */}
      <DatagridConfigurable rowClick="edit">
        {...fields}
        <FieldWrapper label="Actions">
          {(hasShow ?? false) && <ShowButton />}
          {(hasEdit ?? false) && <EditButton />}
        </FieldWrapper>
      </DatagridConfigurable>

    </List>
  )
}

export default ListGuesser
