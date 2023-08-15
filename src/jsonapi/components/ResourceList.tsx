import { type ReactElement } from 'react'
import { ArrayField, BooleanField, ChipField, CreateButton, DatagridConfigurable, DateField, ExportButton, FilterButton, type HttpError, Link, ListGuesser, type ListProps, type NumberFieldProps, type RaRecord, ReferenceManyCount, sanitizeFieldRestProps, SelectColumnsButton, SingleFieldList, TextField, TextInput, TopToolbar, useCreatePath, useRecordContext, useResourceContext, useResourceDefinition, useStore, useTranslate } from 'react-admin'
import { useSearchParams } from 'react-router-dom'

import Typography from '@mui/material/Typography'
import get from 'lodash/get'

import { type JsonApiDocument, type JsonApiErrorObject } from '../types/jsonapi'

export interface FieldDefinition {
  source: string
  dataType: string
};

export interface ResourceListProps<RecordType extends RaRecord = any> extends ListProps {
  fields: FieldDefinition[]
};

const ListActions = () => (
  <TopToolbar>
      <SelectColumnsButton />
      <FilterButton/>
      <CreateButton/>
      <ExportButton/>
  </TopToolbar>

)

const ResourceLinkField = <
RecordType extends Record<string, unknown> = Record<string, any>
>(
    props: NumberFieldProps<RecordType>
  ) => {
  const { className, source, emptyText, ...rest } = props
  const record = useRecordContext(props)
  const value = get(record, source)
  const translate = useTranslate()
  const total = value?.length
  const createPath = useCreatePath()

  // TODO: How-To build the link with the correct resource?
  return (
      <Typography
          component="span"
          variant="body2"
          className={className}
          {...sanitizeFieldRestProps(rest)}
      >
          {<Link to={'TODO'}
              variant="body2"
              onClick={e => { e.stopPropagation() }}>
            {total}
          </Link>}
      </Typography>
  )
}

export const JsonApiList = (
  props: Omit<ListProps, 'children'>
): ReactElement => {
  /** json:api specific list component to handle json:api resources
   *
   */
  const resource = useResourceContext()
  const def = useResourceDefinition()

  const jsonApiType = def.options?.type

  const [listParams, setListParams] = useStore(`${resource}.listParams`)
  const [searchParams, setSearchParams] = useSearchParams()

  const isInvalidSort = (error: JsonApiErrorObject): boolean => {
    if (error.code === 'invalid' && error.detail.includes('sort parameter')) {
      return true
    }
    return false
  }

  const onError = (error: HttpError) => {
    /** Custom error handler for jsonApi bad request response
     *
     * possible if:
     *   - attribute is not sortable
     *   - attribute is not filterable
     *
    */
    if (error.status == 400) {
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

  const postFilters: ReactElement[] = [
    <TextInput key="search" label="Search" source="search" alwaysOn />,
    <TextInput key="filter_title" label="Title contains" source="title__icontains" />
  ]

  return (

    <ListGuesser
      {...props}
      actions={<ListActions />}
      filters={postFilters}
      queryOptions={{ onError, meta: { include: 'keywords' } }}

    >
      <DatagridConfigurable rowClick="edit">
        <TextField source="id"/>
        <TextField source="title"/>
        <DateField source="createdAt"/>
        <BooleanField source="isActive"></BooleanField>
        <ResourceLinkField source="keywords"/>

        <ArrayField source="keywords">

            <SingleFieldList>
                <ChipField source="keyword" size="small" />
            </SingleFieldList>
        </ArrayField>

        {/* <ReferenceManyCount
                label="Layers"
                reference="registry/layers"
                target="service"
                link
        /> */}
      </DatagridConfigurable>
    </ListGuesser>
  )
}
