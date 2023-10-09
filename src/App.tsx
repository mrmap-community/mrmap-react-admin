import { type ReactElement } from 'react'

import MrMapFrontend from './components/MrMapFrontend'
import { HttpClientProvider } from './context/HttpClientContext'

export const App = (): ReactElement => {
  return (
    <HttpClientProvider>
      <MrMapFrontend />
    </HttpClientProvider>
  )
}
