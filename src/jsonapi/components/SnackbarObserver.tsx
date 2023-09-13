import { type ReactNode, useCallback, useEffect } from 'react'
import { useDataProvider } from 'react-admin'

import { useSnackbar } from 'notistack'

import TaskShortInfoLive from '../../components/TaskShortInfoLive'
import { type CrudEvent } from '../../providers/dataProvider'

const SnackbarObserver = (): ReactNode => {
  const dataProvider = useDataProvider()
  const { enqueueSnackbar } = useSnackbar()

  const handleBusEvent = useCallback((event: CrudEvent) => {
    console.log('SnackbarObserver callback fired', event)
    event.payload.ids.forEach(id => {
      enqueueSnackbar(<TaskShortInfoLive id={id} />, { persist: true })
    })
  }, [])

  useEffect(() => {
    // subscribe on mount
    dataProvider.subscribe('resource/BackgroundProcess', handleBusEvent)
    // unsubscribe on unmount
    return () => dataProvider.unsubscribe('resource/BackgroundProcess', handleBusEvent)
  }, [dataProvider])

  return (
    <></>
  )
}

export default SnackbarObserver
