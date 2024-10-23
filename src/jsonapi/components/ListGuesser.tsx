import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { type ConfigurableDatagridColumn, CreateButton, DatagridConfigurable, EditButton, ExportButton, FilterButton, List, type ListProps, type RaRecord, SelectColumnsButton, ShowButton, TopToolbar, useResourceDefinition, useSidebarState, useStore } from 'react-admin'
import { useParams, useSearchParams } from 'react-router-dom'

import { snakeCase } from 'lodash'
import { AxiosError, type OpenAPIV3, type Operation, type ParameterObject } from 'openapi-client-axios'

import HistoryList from '../../components/HistoryList'
import { useHttpClientContext } from '../../context/HttpClientContext'
import useOperationSchema from '../hooks/useOperationSchema'
import inputGuesser from '../openapi/inputGuesser'
import { type JsonApiDocument, type JsonApiErrorObject } from '../types/jsonapi'
import { getIncludeOptions, getSparseFieldOptions } from '../utils'
import FieldGuesser from './FieldGuesser'

interface FieldWrapperProps {
  children: ReactNode[]
  label: string
}
interface ListActionsProps {
  filters: ReactNode[]
}

interface ListGuesserProps extends Partial<ListProps> {
  relatedResource?: string
  additionalActions?: ReactNode
  defaultOmit?: string[]
  onRowSelect?: (selectedRecord: RaRecord) => void
  onRowClick?: (clickedRecord: RaRecord) => void
}

const FieldWrapper = ({ children }: FieldWrapperProps): ReactNode => children

const isInvalidSort = (error: JsonApiErrorObject): boolean => {
  if (error.code === 'invalid' && error.detail.includes('sort parameter')) {
    return true
  }
  return false
}

const getFieldsForSchema = (currentResource: string, schema: OpenAPIV3.NonArraySchemaObject, operation: Operation): ReactNode[] => {
  const fields: ReactNode[] = []
  if (schema !== undefined && operation !== undefined) {
    const parameters = operation?.parameters as ParameterObject[]
    const sortParameterSchema = parameters?.find((parameter) => parameter.name === 'sort')?.schema as OpenAPIV3.ArraySchemaObject
    const sortParameterItemsSchema = sortParameterSchema?.items as OpenAPIV3.SchemaObject
    const sortParameterValues = sortParameterItemsSchema?.enum?.filter((value) => value.includes('-') === false) ||  []

    const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
    const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes?.properties as OpenAPIV3.NonArraySchemaObject
    const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties as OpenAPIV3.NonArraySchemaObject

    Object.entries({ id: jsonApiPrimaryDataProperties?.id, ...jsonApiResourceAttributes ?? {}, ...jsonApiResourceRelationships ?? {} }).forEach(([name, schema]) => {
      const isSortable = sortParameterValues.includes(name)
      fields.push(FieldGuesser(name, schema, isSortable, currentResource))
    })
  }
  return fields
}

const getFilters = (operation: Operation, orderMarker = 'order'): ReactElement[] => {
  const parameters = operation?.parameters as OpenAPIV3.ParameterObject[]
  return parameters?.filter((parameter) => parameter.name.includes('filter'))

    .filter((filter) => !filter.name.includes(orderMarker))
    .map((filter) => {
      const schema = filter.schema as OpenAPIV3.NonArraySchemaObject
      return inputGuesser(filter.name.replace('filter[', '').replace(']', '').replace('.', '_filter_lookup_'), schema, filter.required ?? false)
    }) ?? []
}

const ListActions = (
  { filters }: ListActionsProps
): ReactNode => {
  const { hasCreate} = useResourceDefinition()
  return (
    <TopToolbar>
      <SelectColumnsButton />
      <FilterButton filters={filters} />
      {hasCreate && <CreateButton />}
      <ExportButton />
    </TopToolbar>
  )
}

const ListGuesser = ({
  relatedResource = '',
  additionalActions = undefined,
  onRowSelect = () => { },
  onRowClick = undefined,
  defaultOmit = [],
  ...props
}: ListGuesserProps): ReactElement => {

  const { name, hasShow, hasEdit } = useResourceDefinition(props)
  const { api } = useHttpClientContext()

  const [open] = useSidebarState()

  const [selectedRecord, setSelectedRecord] = useState<RaRecord>()

  const { id } = useParams()
  const [operationId, setOperationId] = useState('')
  const { schema, operation } = useOperationSchema(operationId)

  const fields = useMemo(() => (schema !== undefined && operation !== undefined) ? getFieldsForSchema(name, schema, operation) : [], [schema, operation])
  const filters = useMemo(() => (operation !== undefined) ? getFilters(operation) : [], [operation])
  const includeOptions = useMemo(() => (operation !== undefined) ? getIncludeOptions(operation) : [], [operation])
  const sparseFieldOptions = useMemo(() => (operation !== undefined) ? getSparseFieldOptions(operation) : [], [operation])

  const hasHistoricalEndpoint = useMemo(()=>Boolean(api?.getOperation(`list_Historical${name}`)),[api])

  const [listParams, setListParams] = useStore(`${name}.listParams`, {})
  const [searchParams, setSearchParams] = useSearchParams()
  const [availableColumns] = useStore<ConfigurableDatagridColumn[]>(`preferences.${name}.datagrid.availableColumns`, [])
  const [omit, setOmit ] = useStore<string[]>(`preferences.${name}.datagrid.omit`, defaultOmit)
  const [selectedColumnsIdxs] = useStore<string[]>(`preferences.${name}.datagrid.columns`, [])

  useEffect(()=>{
    const defaultShowColumns = ["stringRepresentation", "title", "abstract", "username", "actions"]
    const wellDefinedColumns = availableColumns.map(col => col.source).filter(source => source !== undefined)    
    setOmit(wellDefinedColumns.filter(source => !defaultShowColumns.includes(source)))
  },[availableColumns])

  const sparseFieldsQueryValue = useMemo(
    () => availableColumns.filter(column => {
      if (column.source === undefined) return false
      
      return sparseFieldOptions.includes(column.source) &&
      selectedColumnsIdxs.length > 0 ? selectedColumnsIdxs.includes(column.index): !omit.includes(column.source)
     }
      ).map(column =>
      // TODO: django jsonapi has an open issue where no snake to cammel case translation are made
      // See https://github.com/django-json-api/django-rest-framework-json-api/issues/1053
      snakeCase(column.source)
    )
    , [sparseFieldOptions, availableColumns, selectedColumnsIdxs]
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


  useEffect(() => {
    if (name !== undefined) {
      if (relatedResource !== undefined && relatedResource !== '') {
        setOperationId(`list_related_${name}_of_${relatedResource}`)
      } else {
        setOperationId(`list_${name}`)
      }
    }
  }, [name])

  const onError = useCallback((error: AxiosError): void => {
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
      const jsonApiDocument = error.response?.data as JsonApiDocument

      jsonApiDocument?.errors?.forEach((apiError: JsonApiErrorObject) => {
        if (isInvalidSort(apiError)) {
          // remove sort from storage
          setListParams({...listParams, sort: ''})

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

  if (operation === undefined || fields === undefined || fields?.length === 0) {
    // if fields are empty the table will be initial rendered only with the default index column.
    // when fields are filled after that render cyclus, the datagrid will be stuck with this single column
    // untill a new full render cyclus becomes started for the datagrid. (for example page change)
    return <div />
  }

  return (
    <List
      filters={filters}
      actions={<ListActions filters={filters} />}
      queryOptions={{
        onError,
        meta: (relatedResource !== undefined && relatedResource !== '')
          ? {
            relatedResource: {
              resource: relatedResource,
              id
            },
            jsonApiParams: { ...jsonApiQuery }
          }
          : {
            jsonApiParams: { ...jsonApiQuery }
          }
      }}
      sx={
        {
          '& .RaList-main': {
            width: `calc(${open ? '60vw' : '80vw'} - ${open ? '240px' : '50px - 2em'})`,
            //maxHeight: 'calc(50vh - 174px )', // 174px ==> 50 appbar, 52 pagination, 64 table actions, 8 top padding
            overfloxX: 'hidden',
            marginLeft: "1em",
            marginRight: "1em",
            marginBottom: "1em",
          },
          '& .RaDatagrid-tableWrapper': {
            overflowX: 'scroll',
            margin: "1em",
          }
        }
      }
      // TODO: only add if historical endpoint is provided!!
      aside={
        hasHistoricalEndpoint ?
        <HistoryList
          resource={`Historical${name ?? ''}`}
          related={name ?? ''}
          record={selectedRecord}
          cardSx={
            {
              margin: '1em',
              height: 'calc(100vh - 110px - 1em)', // 174px ==> 50 appbar, 52 pagination,  1 em top padding
              width: `calc(${open ? '40vw' : '20vw'} - 1em - ${open ? '240px' : '50px'})`,
              overflowY: 'scroll'
            }
          }
        />: undefined
      }

      {...props}

    >
      <DatagridConfigurable
        rowClick={(id, resource, record) => {
          if (onRowClick !== undefined) {
            onRowClick(record)
          } else {
            onRowSelect(record)
            if (selectedRecord !== record) {
              setSelectedRecord(record)
            }
          }
          return false
        }}
      >
        {...fields}
        {/**TODO: label should be translated */}
        <FieldWrapper label="Actions" >
          {hasShow && <ShowButton />}
          {hasEdit && <EditButton />}
          {additionalActions}
        </FieldWrapper >
      </DatagridConfigurable >

    </List >
  )
}

export default ListGuesser
