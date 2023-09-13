import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { type Identifier, type RaRecord, useDataProvider } from 'react-admin'

import Alert, { type AlertColor } from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
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

const getColor = (status: string): AlertColor => {
  switch (status) {
    case 'successed':
      return 'success'
    case 'error':
      return 'error'
    default:
      return 'info'
  }
}

export interface TaskShortInfoLiveProps {
  id: Identifier
}

const TaskShortInfoLive = (
  { id }: TaskShortInfoLiveProps
): ReactNode => {
  const dataProvider = useDataProvider()

  const [task, setTask] = useState<RaRecord>()

  const updateFromRealtimeBus = useCallback((message: CrudEvent) => {
    console.log('TaskShortInfoLive callback fired', message)
    setTask(message.payload.records?.[0])
  }, [])

  useEffect(() => {
    console.log('task updated', task)
  }, [task])

  useEffect(() => {
    // subscribe on mount
    console.log('TaskShortInfoLive mounted')
    dataProvider.subscribe(`resource/BackgroundProcess/${id}`, updateFromRealtimeBus)
    // unsubscribe on unmount
    return () => dataProvider.unsubscribe(`resource/BackgroundProcess/${id}`, updateFromRealtimeBus)
  }, [dataProvider])

  return (

    <Alert elevation={6} severity={getColor(task?.status ?? '')} sx={{ width: '100%' }}>
      <AlertTitle>{task?.processType === 'registering' ? 'Register new Service' : 'Running Task'}</AlertTitle>
      {task?.status !== 'success' ? task?.phase : ''}
      <LinearProgressWithLabel
        value={task?.progress ?? 0}
        color={getColor(task?.status ?? '')}
      />
    </Alert>

  )
}

export default TaskShortInfoLive
