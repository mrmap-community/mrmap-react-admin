import { type ReactElement, useMemo } from 'react'
import {
  Resource, type ResourceProps
} from 'react-admin'
import { Route } from 'react-router-dom'

import { type OpenAPIV3 } from 'openapi-client-axios'
import PropTypes from 'prop-types'

import useGetRelatedOperationSchemas from '../hooks/useGetRelatedOperationSchemas'
import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import { CreateGuesser, EditGuesser } from './FormGuesser'
import ListGuesser from './ListGuesser'

const ResourceGuesser = ({
  list = ListGuesser,
  create = CreateGuesser,
  edit = EditGuesser,
  ...rest
}: ResourceProps): ReactElement => {
  const recordRepresentation = useSchemaRecordRepresentation(rest.name)

  const { schemas, operations } = useGetRelatedOperationSchemas(rest.name)

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

  console.log('relatedRoutes', relatedRoutes)
  return (
    <Resource list={list} create={create} edit={edit} recordRepresentation={recordRepresentation} {...rest} >
      {relatedRoutes}
    </Resource>
  )
}

ResourceGuesser.raName = 'Resource'
ResourceGuesser.registerResource = ({

  ...rest
}: ResourceProps) => ({
  hasList: true,
  hasEdit: true,
  hasCreate: true,
  hasShow: true,
  ...rest
})

ResourceGuesser.propTypes = {
  name: PropTypes.string.isRequired
}

export default ResourceGuesser
