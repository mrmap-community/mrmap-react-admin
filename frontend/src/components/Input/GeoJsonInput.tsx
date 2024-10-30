import type { GeoJSON as GeoJSONType } from 'geojson'

import { type ReactNode, useEffect, useState } from 'react'
import { TextInput, type TextInputProps, useInput } from 'react-admin'
import { MapContainer, TileLayer } from 'react-leaflet'

import { Box } from '@mui/material'

import FeatureGroupEditor from './FeatureGroupEditor'

const style = {
  //position: 'absolute' as const,
  //top: '50%',
  //left: '50%',
  //transform: 'translate(-50%, -50%)',
  width: '100wh',
  height: '200px',
  // bgcolor: 'background.paper',
  // border: '2px solid #000',
  //boxShadow: 24
  // pt: 2,
  // px: 4,
  // pb: 3,
}

const GeoJsonInput = (props: TextInputProps): ReactNode => {

  const [geoJson, setGeoJson] = useState<GeoJSONType>()
  const [geoJsonString, setGeoJsonString] = useState((geoJson != null) ? JSON.stringify(geoJson) : 'huhu')
  const {
    field: { onChange }
  } = useInput(props)

  useEffect(() => {
    setGeoJsonString((geoJson != null) ? JSON.stringify(geoJson) : '')
  }, [geoJson])

  useEffect(() => {
    onChange(geoJsonString)
  }, [geoJsonString])

  return (
    <div style={{width: '100%'}}>
      <TextInput
        {...props}
        contentEditable={false}
        onChange={onChange}
      />

      <Box sx={{ ...style }}>
        <MapContainer
          center={[51.505, -0.09]}
          zoom={2}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100wh' }}

        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FeatureGroupEditor
            geoJson={geoJson}
            geoJsonCallback={setGeoJson}
          />
        </MapContainer>

      </Box>
    </div>
  )
}

export default GeoJsonInput
