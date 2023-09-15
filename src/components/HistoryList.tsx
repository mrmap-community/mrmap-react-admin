import { type ReactNode } from 'react'
import { type RaRecord, SimpleList, type SimpleListProps, useGetList } from 'react-admin'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UpdateIcon from '@mui/icons-material/Update'

const getIcon = (record: RaRecord): ReactNode => {
    console.log(record)
    if (record.historyType === 'created') {
        return <CheckCircleOutlineIcon color='success' />
    } else if (record.historyType === 'updated') {
        return <UpdateIcon color='info' />
    } else if (record.historyType === 'deleted') {
        return <DeleteOutlineIcon color='error' />
    }
}

const getPrimaryText = (record: RaRecord): ReactNode => {
    if (record.historyType === 'created') {
        return 'Created'
    } else if (record.historyType === 'updated') {
        return 'Updated'
    } else if (record.historyType === 'deleted') {
        return 'Deleted'
    }
}

const HistoryList = ({ ...props }: SimpleListProps): ReactNode => {
    console.log('props', props)
    const { data, total, isLoading, error, refetch } = useGetList(
        props.resource ?? '',
        {
            pagination: { page: 1, perPage: 10 },
            meta: { jsonApiParams: { include: 'historyUser' } }
        }

    )

    return (
        <SimpleList

            rightIcon={record => getIcon(record)}
            primaryText={record => getPrimaryText(record)}
            secondaryText={record => `by ${record.historyUser.username}`}
            tertiaryText={record => new Date(record.historyDate).toLocaleDateString()}
            linkType={'show'}
            // rowSx={record => ({ backgroundColor: record.historyType === 'created' ? '#efe' : 'white' })}
            data={data}
            isLoading={isLoading}
            total={total}
            sx={{ flexDirection: 'row', maxHeight: '60vh', overflowY: 'scroll' }}
        />
    )
}

export default HistoryList
