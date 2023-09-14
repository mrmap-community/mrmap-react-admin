import { type ReactNode } from 'react'

import ListGuesser from '../jsonapi/components/ListGuesser'

const RecordHistory = (): ReactNode => {
  return (
    <></>
  )
}

const WmsList = (): ReactNode => {
  return (

    <ListGuesser
      resource='WebMapService'

    // aside={<TaskList />}
    />

  )
}

export default WmsList
