import { useState, type PropsWithChildren, type ReactNode, useEffect, useRef } from 'react'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useMapViewerContext } from './MapViewerContext'

const MapSettingsEditor = ({ children }: PropsWithChildren): ReactNode => {
  const { crsIntersection, selectedCrs, setSelectedCrs } = useMapViewerContext()

  const [crs, setCrs] = useState<string>(selectedCrs?.stringRepresentation ?? 'EPSG:4326')
  const crsRef = useRef(crs)

  useEffect(() => {
    if (crs !== undefined && crsRef !== undefined && crs !== crsRef.current) {
      const newCrs = crsIntersection.find(_crs => _crs.stringRepresentation === crs)
      if (newCrs !== undefined) {
        setSelectedCrs(newCrs)
      }
    }
  }, [crs, crsIntersection, setSelectedCrs])

  return (
      <>
        <Select
            labelId="crs-select-label"
            id="crs-simple-select"
            value={crs}
            label="Reference System"
            onChange={(event) => { setCrs(event.target.value) }}
        >
            {...crsIntersection.map(crs => <MenuItem key={crs.stringRepresentation} value={crs.stringRepresentation}>{crs.stringRepresentation}</MenuItem>)}
        </Select>
      </>
  )
}

export default MapSettingsEditor
