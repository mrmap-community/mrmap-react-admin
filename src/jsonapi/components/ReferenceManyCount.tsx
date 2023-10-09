import { type ReactElement, useMemo } from 'react'
import { Link, type RaRecord } from 'react-admin'

import Chip from '@mui/material/Chip'
import {
  useCreatePath,
  useRecordContext
} from 'ra-core'

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import { hasIncludedData } from '../utils'
import MouseOverPopover from './MouseOverPopover'

export interface ReferenceManyCountProps {
  resource: string
  relatedType: string
  source: string
}

export const ReferenceManyCount = (
  props: ReferenceManyCountProps
): ReactElement => {
  const createPath = useCreatePath()

  const record = useRecordContext(props)

  const references = useMemo(() => record[props.source] ?? undefined, [record])
  // if dataprovider collected the data by json:api include query, we will find more data instead of only id key in the array to present
  const isWellDescribedRefernce = useMemo(() => references !== undefined && hasIncludedData(references), [references])

  const recordRepresentation = useSchemaRecordRepresentation(`list_${props.relatedType}`)
  const RefLink = useMemo(() => <Link
    to={{
      pathname: createPath({ resource: props.resource, id: record.id, type: 'edit' }) + `/${props.relatedType}`
    }}
    variant="body2"
    onClick={e => { e.stopPropagation() }}
  >
    {references?.length}
  </Link>, [record, references])

  const PopOverContent = useMemo(() => references?.map((reference: RaRecord) => (<Chip key={`${record.id}.${reference.id}`} label={reference[recordRepresentation]} />)), [recordRepresentation, references])

  return isWellDescribedRefernce
    ? <MouseOverPopover
      content={PopOverContent}
    >{RefLink}</MouseOverPopover>
    : RefLink
}
