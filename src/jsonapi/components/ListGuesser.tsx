import { type ReactElement, type ReactNode, useContext, useEffect, useState } from 'react'
import { Datagrid, EditButton, type HttpError, List, type ListProps, ShowButton, useResourceContext, useResourceDefinition, useStore } from 'react-admin'
import { useSearchParams } from 'react-router-dom'

import { type OpenAPIV3, type ParameterObject } from 'openapi-client-axios'

import HttpClientContext from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../../openapi/parser'
import fieldGuesser from '../openapi/fieldGuesser'
import { type JsonApiDocument, type JsonApiErrorObject } from '../types/jsonapi'
import FilterGuesser from './FilterGuesser'

const ListGuesser = ({
  ...props
}: ListProps): ReactElement => {
  const { name, hasShow, hasEdit } = useResourceDefinition(props)
  const httpClient = useContext(HttpClientContext)
  const [fields, setFields] = useState<ReactNode[]>()
  const resource = useResourceContext()

  const [listParams, setListParams] = useStore(`${resource}.listParams`)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (name !== '') {
      httpClient
        .then((client) => client.api.getOperation(`list_${name}`))
        .then((operation) => { return { operation, schema: getEncapsulatedSchema(operation) } })
        .then(({ operation, schema }) => {
          const _fields: ReactNode[] = []

          const parameters = operation?.parameters as ParameterObject[]
          const sortParameterSchema = parameters.find((parameter) => parameter.name === 'sort')?.schema as OpenAPIV3.ArraySchemaObject
          const sortParameterItemsSchema = sortParameterSchema.items as OpenAPIV3.SchemaObject
          const sortParameterValues = sortParameterItemsSchema.enum?.filter((value) => value.includes('-') === false)

          const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>

          const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as Record<string, OpenAPIV3.NonArraySchemaObject>
          _fields.push(fieldGuesser('id', jsonApiResourceId, sortParameterValues?.includes('id')))

          const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties as OpenAPIV3.NonArraySchemaObject
          Object.entries(jsonApiResourceAttributes).forEach(([name, schema]) => {
            const isSortable = sortParameterValues?.includes(name)
            _fields.push(fieldGuesser(name, schema, isSortable))
          })

          // TODO:
          const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships

          return _fields
        })
        .then((_fields) => { setFields(_fields) })
        .catch((_) => { })
        .finally(() => { })
    }
  }, [name, httpClient])

  const isInvalidSort = (error: JsonApiErrorObject): boolean => {
    if (error.code === 'invalid' && error.detail.includes('sort parameter')) {
      return true
    }
    return false
  }

  const onError = (error: HttpError): undefined => {
    /** Custom error handler for jsonApi bad request response
     *
     * possible if:
     *   - attribute is not sortable
     *   - attribute is not filterable
     *
    */
    if (error.status === 400) {
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
    }
  }

  return (
    <List
      filters={<FilterGuesser />}
      queryOptions={{ onError, meta: { include: 'keywords' } }}

      {...props}
    >
      <Datagrid>
        {...fields ?? []}
        {(hasShow ?? false) && <ShowButton />}
        {(hasEdit ?? false) && <EditButton />}
      </Datagrid>

    </List>
  )
}

export default ListGuesser
