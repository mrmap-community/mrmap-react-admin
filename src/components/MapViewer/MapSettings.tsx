import { useState, type PropsWithChildren, type ReactNode, useEffect, useRef, useCallback } from 'react'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useMapViewerContext } from './MapViewerContext'
import { Button, FormGroup } from '@mui/material'

const center = [51.505, -0.09]
const zoom = 13

const DisplayPosition = (): ReactNode => {
  const { map } = useMapViewerContext()

  const [position, setPosition] = useState(() => map?.getCenter())
  const [bounds, setBounds] = useState(() => map?.getBounds())

  const onClick = useCallback(() => {
    map?.setView(center, zoom)
  }, [map])

  const onMove = useCallback(() => {
    if (map !== undefined) {
      setPosition(map.getCenter())
      setBounds(map.getBounds())
    }
  }, [map])

  useEffect(() => {
    if (map !== undefined) {
      map.on('move', onMove)
      return () => {
        map.off('move', onMove)
      }
    }
  }, [map, onMove])

  return (
    <FormGroup>
      <div>
      current center (EPSG:4326): latitude: {position?.lat.toFixed(4)}, longitude: {position?.lng.toFixed(4)}{' '}
      </div>
      <div>
      current bounds (EPSG:4326):
      </div>
      <div>
      latitude min: {bounds?.getSouthWest().lat}, longitude min: {bounds?.getSouthWest().lng}, latitude max: {bounds?.getNorthEast().lat}, longitude max: {bounds?.getNorthEast().lng}
      </div>
      <div>
        {bounds?.toBBoxString()}
      </div>

      <Button onClick={onClick}>reset</Button>
    </FormGroup>
  )
}

const MapSettingsEditor = ({ children }: PropsWithChildren): ReactNode => {
  const { crsIntersection, selectedCrs, setSelectedCrs } = useMapViewerContext()

  const [crs, setCrs] = useState<string>(selectedCrs?.stringRepresentation ?? 'EPSG:4326')

  useEffect(() => {
    if (crs !== undefined) {
      const newCrs = crsIntersection.find(_crs => _crs.stringRepresentation === crs)
      if (newCrs !== undefined) {
        setSelectedCrs(newCrs)
      }
    }
  }, [crs, crsIntersection, setSelectedCrs])

  return (
      <>
        <DisplayPosition />

        <div>
        crs bbox: {selectedCrs?.bbox}

        </div>

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
