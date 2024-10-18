import { useCallback, type ReactNode } from 'react'
import { Button, Identifier, Link, useRecordContext, useStore } from 'react-admin'

import AccountTreeIcon from '@mui/icons-material/AccountTree'

import ListGuesser from '../../jsonapi/components/ListGuesser'
const TreeButton = (): ReactNode => {
  const record = useRecordContext()
  const [wmsList, setWmsList] = useStore<Identifier[]>(`mrmap.mapviewer.append.wms`, [])

  const handleOnClick = useCallback(()=>{
    if (record !== undefined){
      const newWmsList = [...wmsList, record.id]
      setWmsList(newWmsList)
    }
  }, [wmsList, setWmsList])

  return (
    <Button
      component={Link}
      to={`/viewer`}
      color="primary"
      onClick={handleOnClick}
    >
      <AccountTreeIcon />
    </Button>
  )
}

const WmsList = (): ReactNode => {
  return (
    <ListGuesser
      resource='WebMapService'
      additionalActions={<TreeButton />}
    // aside={<TaskList />}
    />

  )
}

export default WmsList
