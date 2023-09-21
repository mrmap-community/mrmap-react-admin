import { type ReactNode, useMemo } from 'react'
import { type RaRecord, RecordRepresentation, SimpleList, type SimpleListProps, useGetList, useGetRecordRepresentation } from 'react-admin'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UpdateIcon from '@mui/icons-material/Update'
import { Card, CardHeader } from '@mui/material'
import _ from 'lodash'

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

const getPrimaryText = (record: RaRecord, related: string, selectedRecord: RaRecord, allRecords: any): ReactNode => {
  if (selectedRecord !== undefined) {
    const index = allRecords.indexOf(record) as number
    const lastRecordToCompare = allRecords.at(index + 1)

    const diff = _.difference([record, lastRecordToCompare])

    console.log(diff)
  } else {
    if (record.historyType === 'deleted') {
      return `${record.title} (${record.historyRelation.id})`
    } else {
      return <RecordRepresentation record={record.historyRelation} resource={related} />
    }
  }
}

export interface HistoryListProps extends SimpleListProps {
  related: string
  record: RaRecord
}

const HistoryList = ({ related, record: selectedRecord, ...props }: HistoryListProps): ReactNode => {
  const jsonApiParams = useMemo(() => {
    const params: any = { include: 'historyUser,historyRelation' }
    // params[`fields[${related ?? ''}]`] = 'title'
    params['fields[User]'] = 'username,stringRepresentation'
    if (selectedRecord !== undefined) {
      params['filter[historyRelation]'] = selectedRecord.id
    }
    return params
  }, [props.resource, selectedRecord])

  const { data, total, isLoading, error, refetch } = useGetList(
    props.resource ?? '',
    {
      pagination: { page: 1, perPage: 10 },
      sort: { field: 'historyDate', order: 'DESC' },
      meta: { jsonApiParams }
    }

  )
  const getRecordRepresentation = useGetRecordRepresentation(related)

  return (
    <Card>
      <CardHeader
        title={(selectedRecord === undefined) ? 'Last 10 events' : getRecordRepresentation(selectedRecord)}
        subheader={
          <SimpleList
            leftIcon={record => getIcon(record)}
            primaryText={record => getPrimaryText(record, related, selectedRecord, data)}
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
