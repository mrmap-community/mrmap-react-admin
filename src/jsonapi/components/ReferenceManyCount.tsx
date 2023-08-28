import { type ReactElement, useMemo } from 'react'
import { Link, type RaRecord } from 'react-admin'

import Chip from '@mui/material/Chip'
import {
  useCreatePath,
  useRecordContext
} from 'ra-core'

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import MouseOverPopover from './MouseOverPopover'

export interface ReferenceManyCountProps {
  source: string
  reference: string
}

export const ReferenceManyCount = (
  props: ReferenceManyCountProps
): ReactElement => {
  const createPath = useCreatePath()

  const record = useRecordContext(props)

  const references = useMemo(() => record[props.source] ?? undefined, [record])
  // if dataprovider collected the data by json:api include query, we will find more data instead of only id key in the array to present
  const isWellDescribedRefernce = useMemo(() => references !== undefined && (Object.entries(references).find(([name, schema]) => name !== 'id') != null), [references])

  const recordRepresentation = useSchemaRecordRepresentation(`list_${props.reference}`)
  console.log('recordRepresentation', recordRepresentation, references)
  const RefLink = useMemo(() => <Link
    to={{
      pathname: createPath({ resource: props.reference, type: 'list' })
      // TODO:
      // search: `filter=${JSON.stringify({
      //       ...(filter || {}),
      //       [target]: record[source]
      //   })}`
    }}
    variant="body2"
    onClick={e => { e.stopPropagation() }}
  >
    {references?.length}
  </Link>, [references])

  const PopOverContent = useMemo(() => references?.map((reference: RaRecord) => (<Chip key={`${record.id}.${reference.id}`} label={reference[recordRepresentation]} />)), [recordRepresentation, references])

  return isWellDescribedRefernce
    ? <MouseOverPopover
      content={PopOverContent}
    >{RefLink}</MouseOverPopover>
    : RefLink
}
