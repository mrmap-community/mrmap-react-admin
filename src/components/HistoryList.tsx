import { type ReactNode, useMemo } from 'react'
import { type RaRecord, RecordRepresentation, SimpleList, type SimpleListProps, useGetList } from 'react-admin'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UpdateIcon from '@mui/icons-material/Update'
import { Card, CardHeader } from '@mui/material'

const getIcon = (record: RaRecord): ReactNode => {
  if (record.historyType === 'created') {
    return <CheckCircleOutlineIcon color='success' />
  } else if (record.historyType === 'updated') {
    return <UpdateIcon color='info' />
  } else if (record.historyType === 'deleted') {
    return <DeleteOutlineIcon color='error' />
  }
}

const getTertiaryText = (record: RaRecord): ReactNode => {
  return `${new Date(record.historyDate).toLocaleString('de-DE')}, by ${record.historyUser.username}`
}

export interface HistoryListProps extends SimpleListProps {
  related: string
  record: RaRecord
}

const HistoryList = ({ related, record, ...props }: HistoryListProps): ReactNode => {
  const jsonApiParams = useMemo(() => {
    const params: any = { include: 'historyUser,historyRelation' }
    // params[`fields[${related ?? ''}]`] = 'title'
    params['fields[User]'] = 'username,stringRepresentation'
    if (record !== undefined) {
      params['filter[historyRelation]'] = record.id
    }
    return params
  }, [props.resource, record])

  const { data, total, isLoading, error, refetch } = useGetList(
    props.resource ?? '',
    {
      pagination: { page: 1, perPage: 10 },
      sort: { field: 'historyDate', order: 'DESC' },
      meta: { jsonApiParams }
    }

  )

  return (
    <Card>
      <CardHeader
        title='Last 10 events'
        subheader={
          <SimpleList
            leftIcon={record => getIcon(record)}
            primaryText={record => <RecordRepresentation record={record.historyRelation} resource={related} />}
            tertiaryText={record => getTertiaryText(record)}
            linkType={false}
            // rowSx={record => ({ backgroundColor: record.historyType === 'created' ? '#efe' : 'white' })}
            data={data}
            isLoading={isLoading}
            total={total}
            // sx={{ overflowY: 'scroll' }}
            {...props}
          />
        }
      >

      </CardHeader>

    </Card>
  )
}

export default HistoryList
