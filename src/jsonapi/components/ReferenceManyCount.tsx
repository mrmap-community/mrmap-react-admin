import { type ReactNode } from 'react'
import { Link } from 'react-admin'

import {
  useCreatePath,
  useRecordContext
} from 'ra-core'

export interface ReferenceManyCountProps {
  source: string
  reference: string
}

export const ReferenceManyCount = (
  props: ReferenceManyCountProps
): ReactNode => {
  const record = useRecordContext(props)
  const createPath = useCreatePath()

  return (
    <Link
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
      {record[props.source].length}
    </Link>
  )
}
