
import jsonpointer from 'jsonpointer'
import { getDocument } from './utils'
import { Polygon } from 'geojson'
import { ElevationDimension, Style, TempDimension, TimeDimension, WmsCapabilitites, WmsLayer } from './types'
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

export const parseStyle = (style: any): Style => {
    return {
        metadata: {
            name: jsonpointer.get(style, '/Name'),
            title: jsonpointer.get(style, '/Title'),
            abstract: jsonpointer.get(style, '/Abstract')
        },
        legendUrl: {
            mimeType: jsonpointer.get(style, '/LegendURL/Format'),
            href: jsonpointer.get(style, '/LegendURL/OnlineResource/@_href'),
            width: jsonpointer.get(style, '/LegendURL/@_width'),
            height: jsonpointer.get(style, '/LegendURL/@_height')
        }
    }
}

export const forceArray = (obj: any): Array<any> => {
    return Array.isArray(obj) ? obj : [obj]
}

export const parseLayer = (layer: any): WmsLayer => {
    const abstract = jsonpointer.get(layer, '/Abstract')
    const parsedCrs = jsonpointer.get(layer, '/CRS')
    const crs = parsedCrs === undefined ? [] : forceArray(parsedCrs)

    const parsedStyles: any = jsonpointer.get(layer, '/Style')
    const styles = parsedStyles === undefined ? [] : forceArray(parsedStyles).map((style: any) => parseStyle(style))

    const layerObj: WmsLayer = {
        metadata: {
            title: jsonpointer.get(layer, '/Title'),
            name: jsonpointer.get(layer, '/Name'),
            ...(abstract && {abstract: abstract})
        },
        ...(crs?.length > 0 && {referenceSystems: crs}),
        bbox: layerBboxToGeoJSON(jsonpointer.get(layer, '/EX_GeographicBoundingBox')),
        ...(styles?.length > 0 && {styles: styles})
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

    const parsedCapabilites = getDocument(xml)
    
    const capabilities = {
        version: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/@_version'),
        metadata: {
            name: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Service/Name'),
            title: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Service/Title'),
            abstract: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Service/Abstract'),
        },
        operationUrls: {
            getCapabilities: {
                mimeTypes: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetCapabilities/Format'),
                get: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetCapabilities/DCPType/HTTP/Get/OnlineResource/@_href'),
                post: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetCapabilities/DCPType/HTTP/Post/OnlineResource/@_href')
            },
            getMap: {
                mimeTypes: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetMap/Format'),
                get: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetMap/DCPType/HTTP/Get/OnlineResource/@_href'),
                post: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetMap/DCPType/HTTP/Post/OnlineResource/@_href')
            },
            getFeatureInfo: {
                mimeTypes: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetFeatureInfo/Format'),
                get: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetFeatureInfo/DCPType/HTTP/Get/OnlineResource/@_href'),
                post: jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Request/GetFeatureInfo/DCPType/HTTP/Post/OnlineResource/@_href')
            }
        },
        rootLayer: parseLayer(jsonpointer.get(parsedCapabilites, '/WMS_Capabilities/Capability/Layer'))
    }



    return capabilities
}