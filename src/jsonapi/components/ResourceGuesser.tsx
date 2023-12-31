import { type ReactElement, useMemo } from 'react'
import {
  Loading,
  type RecordToStringFunction,
  Resource, type ResourceProps
} from 'react-admin'
import { Route } from 'react-router-dom'

import { type OpenAPIV3 } from 'openapi-client-axios'
import PropTypes from 'prop-types'

import useGetRelatedOperationSchemas from '../hooks/useGetRelatedOperationSchemas'
import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import { CreateGuesser, EditGuesser } from './FormGuesser'
import ListGuesser from './ListGuesser'

let _recordRepresentation: RecordToStringFunction = (record) => { return record.id }

const ResourceGuesser = ({
  list = ListGuesser,
  create = CreateGuesser,
  edit = EditGuesser,
  ...rest
}: ResourceProps): ReactElement => {
  _recordRepresentation = useSchemaRecordRepresentation(`list_${rest.name}`)

  const { schemas } = useGetRelatedOperationSchemas(rest.name)

  const relatedResources = useMemo<string[]>(() => {
    return schemas?.map((schema) => {
      const properties = schema?.properties as OpenAPIV3.NonArraySchemaObject
      const jsonApiTypeProperty = properties?.type as OpenAPIV3.NonArraySchemaObject
      const jsonApiTypeReferences = jsonApiTypeProperty?.allOf as OpenAPIV3.SchemaObject[]
      return jsonApiTypeReferences?.[0]?.enum?.[0] as string
    }) ?? []
  }, [schemas])

  const relatedRoutes = useMemo(() => relatedResources?.map((resource) => <Route key={''} path={`:id/${resource}`} element={<ListGuesser resource={resource} relatedResource={rest.name}> </ListGuesser>}></Route>)
    , [relatedResources])

  if (schemas === undefined) {
    return <Loading loadingSecondary={`'loading related resources of ${rest.name}`} />
  }

  return (
    <Resource list={list} create={create} edit={edit} {...rest} >
      {relatedRoutes}
      {rest.children}
    </Resource>
  )
}

ResourceGuesser.raName = 'Resource'

ResourceGuesser.registerResource = ({
  create,
  edit,
  icon,
  list,
  name,
  options,
  show,
  recordRepresentation,
  hasCreate,
  hasEdit,
  hasShow
}: ResourceProps) => ({
  name,
  options,
  hasList: (list !== null),
  hasCreate: (create !== null) || !!(hasCreate ?? false),
  hasEdit: (edit !== null) || !!(hasEdit ?? false),
  hasShow: (show !== null) || !!(hasShow ?? false),
  icon,
  recordRepresentation: recordRepresentation ?? _recordRepresentation
})

ResourceGuesser.propTypes = {
  name: PropTypes.string.isRequired
}

export default ResourceGuesser
