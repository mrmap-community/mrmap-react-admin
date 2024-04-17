
import jsonpointer from 'jsonpointer'
import { getDocument } from './utils'
import { Polygon } from 'geojson'
import { ElevationDimension, TempDimension, TimeDimension, WmsCapabilitites, WmsLayer } from './types'
import {duration} from 'moment'

export const layerBboxToGeoJSON = (bbox: any): Polygon | undefined => {
    if (bbox === undefined){
        return undefined
    }
    return {
        type: 'Polygon',
        coordinates: [
            [bbox["westBoundLongitude"], bbox["southBoundLatitude"]],
            [bbox["eastBoundLongitude"], bbox["southBoundLatitude"]],
            [bbox["eastBoundLongitude"], bbox["northBoundLatitude"]],
            [bbox["westBoundLongitude"], bbox["northBoundLatitude"]],
            [bbox["westBoundLongitude"], bbox["southBoundLatitude"]]
        ]
    }
}

export const parseStyle = (style: any) => {
    return {
        name: jsonpointer.get(style, "/Name"),
        title: jsonpointer.get(style, "/Title"),
        abstract: jsonpointer.get(style, "/Abstract"),
    }
}

export const parseTimeDimension = (timeDimension: any) => {

}

export const parseDimension = (dimension: any): TimeDimension | TempDimension | ElevationDimension | undefined => {
    const type = jsonpointer.get(dimension, '/@_name')
    const units = jsonpointer.get(dimension, '/@_units')
    if (type === 'time' && units === 'ISO8601'){
        // TimeDimension handling
        const dimensionValue = jsonpointer.get(dimension, '/#text')
        const [start, stop, resolution] = dimensionValue.split('/')

        return {
            start: new Date(start),
            stop: new Date(stop) ?? undefined,
            resolution: duration(resolution) ?? undefined
        }

    } else if (type ==='temperature'){
        // Temperature dimension handling
        return {
            unit: jsonpointer.get(dimension, '/units'),
            unitSymbol: jsonpointer.get(dimension, '/unitSymbol'),
            default: jsonpointer.get(dimension, '/default'),
            values: jsonpointer.get(dimension, '/#text').split('/')
        }
    } else if (type === 'elevation') {
        // Elevation dimension handling
        return {
            crs: jsonpointer.get(dimension, '/units'),
            unitSymbol: jsonpointer.get(dimension, '/unitSymbol'),
            default: jsonpointer.get(dimension, '/default'),
            values: jsonpointer.get(dimension, '/#text').split('/')
        } 
    }
}

export const parseLayer = (layer: any): WmsLayer => {
    const layerObj: WmsLayer = {
        metadata: {
            title: jsonpointer.get(layer, '/Title'),
            name: jsonpointer.get(layer, '/Name'),
            abstract: jsonpointer.get(layer, '/Abstract')
        },
        referenceSystems: jsonpointer.get(layer, '/CRS'),
        bbox: layerBboxToGeoJSON(jsonpointer.get(layer, '/EX_GeographicBoundingBox')),
    }

    const sublayer = jsonpointer.get(layer, '/Layer')

    if (sublayer === undefined){
        // no sublayers
    } else if (Array.isArray(sublayer)){
        // ancestor node ==> children are there
        const parsedSublayers: WmsLayer[] = []
        sublayer.forEach((sublayer) => {
            const parsedLayer = parseLayer(sublayer)
            if (parsedLayer !== undefined){
                parsedSublayers.push(parsedLayer)
            }
        })
        layerObj.children = parsedSublayers
    } else {
        // leaf node
        const parsedLayer = parseLayer(sublayer)
        if (parsedLayer !== undefined){
            layerObj.children = [parsedLayer]
        }
    }

    return layerObj
}

export const parseWms = (xml: string): WmsCapabilitites => {

    const capabilites = getDocument(xml)
    
    return {
        version: jsonpointer.get(capabilites, '/WMS_Capabilities/@_version'),
        metadata: {
            name: jsonpointer.get(capabilites, '/WMS_Capabilities/Service/Name'),
            title: jsonpointer.get(capabilites, '/WMS_Capabilities/Service/Title'),
            abstract: jsonpointer.get(capabilites, '/WMS_Capabilities/Service/Abstract'),
        },
        operationUrls: {
            getCapabilities: {
                mimeTypes: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetCapabilities/Format'),
                get: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetCapabilities/DCPType/HTTP/Get/OnlineResource/@_href'),
                post: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetCapabilities/DCPType/HTTP/Post/OnlineResource/@_href')
            },
            getMap: {
                mimeTypes: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetMap/Format'),
                get: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetMap/DCPType/HTTP/Get/OnlineResource/@_href'),
                post: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetMap/DCPType/HTTP/Post/OnlineResource/@_href')
            },
            getFeatureInfo: {
                mimeTypes: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetFeatureInfo/Format'),
                get: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetFeatureInfo/DCPType/HTTP/Get/OnlineResource/@_href'),
                post: jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Request/GetFeatureInfo/DCPType/HTTP/Post/OnlineResource/@_href')
            }
        },
        rootLayer: parseLayer(jsonpointer.get(capabilites, '/WMS_Capabilities/Capability/Layer'))
    }
}