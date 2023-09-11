import { type ReactNode } from 'react'

import ListGuesser from '../jsonapi/components/ListGuesser'
import TaskList from './TaskList'

const WmsList = (): ReactNode => {
  return (
    <div style={{ height: 350, width: '100%' }}>
      <ListGuesser

        resource='WebMapService'
        aside={<TaskList />}
      />
    </div>
  )
}

export default WmsList
