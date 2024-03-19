import { type PropsWithChildren, type ReactNode } from 'react'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useMapViewerContext } from './MapViewerContext'

const MapSettingsEditor = ({ children }: PropsWithChildren): ReactNode => {
  const { crsIntersection, selectedCrs, setSelectedCrs } = useMapViewerContext()

  const handleChange = (event: SelectChangeEvent): void => {
    setSelectedCrs(event.target.value)
  }

  return (
      <>
        <Select
            labelId="crs-select-label"
            id="crs-simple-select"
            value={selectedCrs}
            label="Reference System"
            onChange={handleChange}
        >
            {...crsIntersection.map(crs => <MenuItem key={crs.stringRepresentation} value={crs.stringRepresentation}>{crs.stringRepresentation}</MenuItem>)}
        </Select>
      </>
  )
}

export default MapSettingsEditor
