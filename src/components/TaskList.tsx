import { type ReactNode, useEffect } from 'react'
import { List, type RaRecord, SimpleList, useDataProvider } from 'react-admin'

import CheckBoxIcon from '@mui/icons-material/CheckBox'
import HelpCenterIcon from '@mui/icons-material/HelpCenter'
import Box from '@mui/material/Box'
import LinearProgress, { type LinearProgressProps } from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import { type CrudEvent } from '../providers/dataProvider'

const LinearProgressWithLabel = (props: LinearProgressProps & { value: number }): ReactNode => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  )
}

const getLeftIcon = (record: RaRecord): ReactNode => {
  switch (record.status) {
    case 'successed':
      return <CheckBoxIcon color='success' />
    default:
      return <HelpCenterIcon color='inherit' />
  }
}

const getSecondaryText = (record: RaRecord): ReactNode => {
  const value = record.status === 'successed' ? 100 : record.progress
  const color = record.status === 'successed' ? 'success' : 'inherit'
  return <LinearProgressWithLabel
    variant="determinate"
    value={value}
    color={color}
  />
}

const TaskList = (): ReactNode => {
  const dataProvider = useDataProvider()

  useEffect(() => {
    const callback = (event: CrudEvent): void => {
      console.log('callback fired', event)
    }
    // subscribe to the 'messages' topic on mount
    dataProvider.subscribe('BackgroundProcess', callback)
    // unsubscribe on unmount
    return () => dataProvider.unsubscribe('messages', callback)
  }, [dataProvider])

  return (
    <List
      resource='BackgroundProcess'
      pagination={undefined}
    >
      <SimpleList
        leftIcon={getLeftIcon}
        primaryText={record => record.status}
        secondaryText={getSecondaryText}
      // tertiaryText={record => new Date(record.dateCreated).toLocaleDateString()}
      // rowSx={record => ({ backgroundColor: record.status === 'successed' ? 'green' : 'red' })}
      >

      </SimpleList>

    </List>
  )
}

export default TaskList
