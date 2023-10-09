import { type ReactNode } from 'react'
import { Button, Link, useRecordContext } from 'react-admin'

import AccountTreeIcon from '@mui/icons-material/AccountTree'

import ListGuesser from '../jsonapi/components/ListGuesser'
const TreeButton = (): ReactNode => {
  const record = useRecordContext()

  return (
    <Button
      component={Link}
      to={`${record.id}/tree`}
      color="primary"
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
