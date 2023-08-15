import { useCallback, useEffect, useRef, useState } from 'react'
import { TextInput, type TextInputProps, useInput } from 'react-admin'
import { useForm } from 'react-hook-form'
import { FeatureGroup, GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'

import { Box, Modal, Typography } from '@mui/material'
import { useLeafletContext } from '@react-leaflet/core'
import type { GeoJSON as GeoJSONType, MultiPolygon, Position } from 'geojson'
import L, { Polygon } from 'leaflet'

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height: '80%',
  // bgcolor: 'background.paper',
  // border: '2px solid #000',
  boxShadow: 24
  // pt: 2,
  // px: 4,
  // pb: 3,
}

export interface EditorProps {
  geoJson?: GeoJSONType
  setGeoJson: Function
};

const Editor = (props: EditorProps) => {
  const context = useLeafletContext()

  const updateGeoJson = useCallback((event: any) => {
    const multiPolygon: MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: []
    }

    context.map.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        const coordinates = layer.toGeoJSON().geometry.coordinates as Position[][]
        multiPolygon.coordinates.push(coordinates)
      }
    })
    props.setGeoJson(multiPolygon)
  }, [])

  useEffect(() => {
    if (props.geoJson != null) {
      const bounds = L.geoJSON(props.geoJson).getBounds()
      if (Object.keys(bounds).length > 1) {
        context.map.flyToBounds(bounds, { duration: 0.3 })
      }
    }
  }, [props.geoJson])

  const geoJsonObject = (props.geoJson != null) ? <GeoJSON data={props.geoJson} /> : <div></div>

  return (
    <FeatureGroup

    >
      {geoJsonObject}
      <EditControl
        position='topright'
        onEdited={updateGeoJson}
        onCreated={updateGeoJson}
        onDeleted={updateGeoJson}
        // onDrawStop={onEdit}
        draw={{
          marker: false,
          circlemarker: false,
          circle: false
        }}
      />
    </FeatureGroup>
  )
}

const GeoJsonInput = (props: TextInputProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const [geoJson, setGeoJson] = useState<GeoJSONType>()
  const [geoJsonString, setGeoJsonString] = useState((geoJson != null) ? JSON.stringify(geoJson) : 'huhu')
  const {
    field: { value, onChange },
    fieldState: { isTouched, error },
    formState: { isSubmitted },
    isRequired
  } = useInput(props)

  useEffect(() => {
    setGeoJsonString((geoJson != null) ? JSON.stringify(geoJson) : '')
  }, [geoJson])

  useEffect(() => {
    onChange(geoJsonString)
  }, [geoJsonString])

  console.log('geojson', geoJson, geoJsonString)

  return (
      <div>
      <TextInput
        {...props}
        onClick={() => {
          setIsOpen(true)
        }
        }
        contentEditable={false}
        onChange={onChange}
      />
      <Modal
            open={isOpen}
            onClose={() => { setIsOpen(false) }}
            aria-labelledby="modal-modal-title"
        >
        <Box sx={{ ...style }}>
            <Typography id="modal-modal-title" variant="h6" component="h2" >
            {props.title ?? props.label} huhu
            </Typography>

            <MapContainer
              center={ [51.505, -0.09] }
              zoom={2}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100wh' }}

            >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Editor
              geoJson={geoJson}
              setGeoJson={setGeoJson}
            />
          </MapContainer>

        </Box>
        </Modal>
      </div>
  )
}

export default GeoJsonInput
