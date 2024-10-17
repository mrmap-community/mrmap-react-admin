import { type ReactNode } from 'react'
import { Button, Link, useRecordContext, useStore } from 'react-admin'

import AccountTreeIcon from '@mui/icons-material/AccountTree'

import ListGuesser from '../../jsonapi/components/ListGuesser'
const TreeButton = (): ReactNode => {
  const record = useRecordContext()

  const [getCapabilititesUrls, setGetCapabilititesUrls] = useStore<string[]>(`mrmap.mapviewer.append.wms`, [])


  return (
    <Button
      component={Link}
      to={`/viewer`}
      color="primary"
      // onClick={setGetCapabilititesUrls(record)}
    >
      <AccountTreeIcon />
    </Button>
  )
}

const WmsList = (): ReactNode => {
  return (

    <ListGuesser
      resource='WebMapService'
      // additionalActions={<TreeButton />}
    // aside={<TaskList />}
    />

  )
}

export default WmsList
