import { useState, type PropsWithChildren, type ReactNode, useEffect, useRef, useCallback, useMemo } from 'react'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useMapViewerContext } from './MapViewerContext'
import { Button, FormGroup } from '@mui/material'
import { LatLngBounds } from 'leaflet'
import { type Map } from 'leaflet'
import L from 'leaflet'



const center = [51.505, -0.09]
const zoom = 13





const DisplayPosition = (): ReactNode => {
  const { map } = useMapViewerContext()

  const [position, setPosition] = useState(() => map?.getCenter())
  const [bounds, setBounds] = useState(() => map?.getBounds())

  const positionGeoJSON = useMemo(()=>{
    if (position === undefined){
      return
    }
    return `
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [${position.lng}, ${position.lat}]
        },
        "properties": {
          "name": "center"
        }
      }
    `
  },[position])

  const boundsGeoJSON = useMemo(()=>{
    if (bounds === undefined){
      return
    }
    return `
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [${bounds.getSouthWest().lng}, ${bounds.getSouthWest().lat}], 
            [${bounds.getNorthEast().lng}, ${bounds.getSouthWest().lat}], 
            [${bounds.getNorthEast().lng}, ${bounds.getNorthEast().lat}], 
            [${bounds.getSouthWest().lng}, ${bounds.getNorthEast().lat}],
            [${bounds.getSouthWest().lng}, ${bounds.getSouthWest().lat}]
          ]]
        },
        "properties": {
          "name": "bbox"
        }
      }
    `
  },[bounds])

  const featureCollection = useMemo(()=>{
    if (position === undefined || bounds === undefined){
      return
    }
    return `
    { 
      "type": "FeatureCollection",
      "features": [
        ${positionGeoJSON},
        ${boundsGeoJSON}
      ]
    }
  `
  },[position, bounds])

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
        {featureCollection}
      </div>

      <Button onClick={onClick}>reset</Button>
    </FormGroup>
  )
}



const MapSettingsEditor = ({ children }: PropsWithChildren): ReactNode => {
  const { crsIntersection, selectedCrs, setSelectedCrs } = useMapViewerContext()

  const [crs, setCrs] = useState<string>(selectedCrs?.stringRepresentation ?? 'EPSG:4326')

  const menuItems = useMemo(()=>{
    if (crsIntersection?.length > 0){
      return crsIntersection.map(crs => <MenuItem key={crs.stringRepresentation} value={crs.stringRepresentation}>{crs.stringRepresentation}</MenuItem>)
    } else {
      return [<MenuItem key={'EPSG:4326'} value={'EPSG:4326'}>EPSG:4326</MenuItem>]
    }
  },[crsIntersection])

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
            defaultValue='EPSG:4326'
            label="Reference System"
            onChange={(event) => { setCrs(event.target.value) }}
        >
            {...menuItems}
        </Select>
      </>
  )
}

export default MapSettingsEditor
