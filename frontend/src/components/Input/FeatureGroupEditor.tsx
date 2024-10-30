import type { GeoJSON as GeoJSONType, MultiPolygon } from 'geojson'

import { type ReactNode, useCallback, useEffect } from 'react'
import { FeatureGroup, GeoJSON } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'

import { useLeafletContext } from '@react-leaflet/core'
import L from 'leaflet'

export interface GeoEditorProps {
  geoJson?: GeoJSONType
  geoJsonCallback: (multiPolygon: MultiPolygon) => void
}

const FeatureGroupEditor = ({
  geoJson,
  geoJsonCallback
}: GeoEditorProps): ReactNode => {
  const context = useLeafletContext()

  const updateGeoJson = useCallback((event: any) => {
    const multiPolygon: MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: []
    }

    context.map.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        const geometry = layer.toGeoJSON().geometry
        if (geometry.type === 'MultiPolygon'){
          multiPolygon.coordinates.push(...geometry.coordinates)
        } else {
          multiPolygon.coordinates.push(geometry.coordinates)
        }
      }
    })
    geoJsonCallback(multiPolygon)
  }, [])

  useEffect(() => {
    if (geoJson != null) {
      const bounds = L.geoJSON(geoJson).getBounds()
      if (Object.keys(bounds).length > 1) {
        context.map.flyToBounds(bounds, { duration: 0.3 })
      }     
    }
  }, [])

  const geoJsonObject = (geoJson != null) ? <GeoJSON data={geoJson} /> : null

  return (
    <FeatureGroup>
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

export default FeatureGroupEditor
