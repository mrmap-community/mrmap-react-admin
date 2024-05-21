import type { GeoJSON as GeoJSONType, MultiPolygon, Position } from 'geojson'

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
        const coordinates = layer.toGeoJSON().geometry.coordinates as Position[][]
        multiPolygon.coordinates.push(coordinates)
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
  }, [geoJson])

  const geoJsonObject = (geoJson != null) ? <GeoJSON data={geoJson} /> : <div></div>

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
