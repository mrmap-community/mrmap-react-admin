import { type ReactElement, useMemo } from 'react'
import {
  Resource, type ResourceProps
} from 'react-admin'

import PropTypes from 'prop-types'

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

  return (
    <Resource list={list} create={create} edit={edit} recordRepresentation={recordRepresentation} {...rest} />
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
