import { type ReactNode, useMemo } from 'react'
import { type RaRecord } from 'react-admin'
import { WMSTileLayer } from 'react-leaflet'

export interface WMSTileLayerSingleRequestProps {
  selectedNodes: RaRecord[]
  ogcService: RaRecord
}

const WMSTileLayerSingleRequest = ({
  selectedNodes,
  ogcService
}: WMSTileLayerSingleRequestProps): ReactNode => {
  // const map = useMap()

  const getMapUrl: string = useMemo(() => { return ogcService?.operationUrls?.find((operationUrl: RaRecord) => operationUrl.operation === 'GetMap' && operationUrl.method === 'Get')?.url ?? '' }, [ogcService])

  const layers: string = useMemo(() => {
    // we call only the leafnodes
    const layerIdentifiers = selectedNodes.filter(node => Math.floor((node.mpttRgt - node.mpttLft) / 2) === 0).map(node => node.identifier).filter(identifier => !(identifier === null || identifier === undefined))
    return layerIdentifiers.join(',') ?? ''
  }, [selectedNodes])

  if (layers === '' || getMapUrl === '') {
    return null
  }

  return (
    <WMSTileLayer
      url={getMapUrl}
      params={
        { layers }
      }
      version={ogcService?.version === '' ? '1.3.0' : ogcService?.version}
      transparent={true}
      zoomOffset={-1}
      format='image/png'
      noWrap
    />

  )
}

export default WMSTileLayerSingleRequest
