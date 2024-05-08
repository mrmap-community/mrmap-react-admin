import { useState, type PropsWithChildren, type ReactNode, useEffect, useRef, useCallback, useMemo } from 'react'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useOwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase'
import { FormGroup } from '@mui/material'
import { boundsToGeoJSON, featuresToCollection, latLngToGeoJSON, polygonToFeature } from './utils'
import type { Polygon } from 'geojson'


export interface DisplayPositionProps {
  crsBbox?: Polygon
}



const DisplayPosition = ({
  crsBbox
}: DisplayPositionProps): ReactNode => {

  const { map } = useOwsContextBase()

  const [position, setPosition] = useState(() => map?.getCenter())
  const [bounds, setBounds] = useState(() => map?.getBounds())

  const positionGeoJSON = useMemo(()=>{
    return position ? latLngToGeoJSON(position): undefined
  },[position])

  const boundsGeoJSON = useMemo(()=>{
    return bounds ? boundsToGeoJSON(bounds): undefined
  },[bounds])

  const featureCollection = useMemo(()=>{
    const features = []
    if (crsBbox !== undefined){
      features.push(polygonToFeature(crsBbox, "crs bbox"))
    }
    if (positionGeoJSON !== undefined){
      features.push(positionGeoJSON)
    }
    if (boundsGeoJSON !== undefined){
      features.push(boundsGeoJSON)
    }
      
    return featuresToCollection(features)
  },[position, bounds])



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
        Current Boundary:
        {featureCollection}
      </div>
    </FormGroup>
  )
}



const MapSettingsEditor = ({ children }: PropsWithChildren): ReactNode => {
  const { crsIntersection, selectedCrs, setSelectedCrs } = useOwsContextBase()

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
        <DisplayPosition 
          crsBbox={selectedCrs?.bbox}
        />

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

