import { WmsCapabilitites, WmsLayer } from "../XMLParser/types";
import { OWSContext, OWSResource, StyleSet } from "./types";

export const OWSContextDocument = (): OWSContext => {

    return {
        id: "huhu",
        type: "FeatureCollection",
        properties: {
            lang: "en",
            title: "this is my first collection",
            updated: new Date().toISOString()
        },
        features: [],
        
    }
}

export const updateOrAppendSearchParam = (params: URLSearchParams, key: string, value: string) => {
    if ( params.has(key) ) {
        params.set(key, value)
    }
    else if ( params.has(key.toUpperCase() )) {
        params.set(key.toUpperCase(), value)
    } else if ( params.has(key.toLowerCase()) ) {
        params.set(key.toLowerCase(), value)
    } else {
        params.append(key, value)
    }
}


export const prepareGetMapUrl = (
    capabilities: WmsCapabilitites, node: WmsLayer
): URL => {
    const url = new URL(capabilities.operationUrls.getMap.get)
    const params = url.searchParams
  
    updateOrAppendSearchParam(params, 'SERVICE', 'wms')
    updateOrAppendSearchParam(params, 'VERSION', capabilities.version)
    updateOrAppendSearchParam(params, 'REQUEST', 'GetMap')
    updateOrAppendSearchParam(params, 'FORMAT', 'image/png') // todo: should be configureable
    updateOrAppendSearchParam(params, 'LAYERS', node.metadata.name)

    return url
}

export const layerToFeature = (capabilities: WmsCapabilitites, node: WmsLayer, folder: string): OWSResource => {
    return {
        type: "Feature",
        title: node.metadata.title,
        properties: {
            updated: new Date().toISOString(),
            offering: {
                code: "http://www.opengis.net/spec/owc-geojson/1.0/req/wms",
                operations: [
                    {
                        code: "GetCapabilitites",
                        href: capabilities.operationUrls.getCapabilities.get,
                        method: "GET",
                        type: "application/xml"
                    },
                    // todo: this will only produce one url with image/png type; provide operations for different mime types
                    {
                        code: "GetMap",
                        href: prepareGetMapUrl(capabilities, node).toString(),
                        method: "GET",
                        type: "image/png"
                    },
                    // todo: add GetFeatureInfo url
                ],
                styles: node.styles.map((style): StyleSet => {
                    return {
                        name: style.metadata.name,
                        title: style.metadata.title,
                        abstract: style.metadata.abstract,
                        legendURL: style.legendUrl?.href.toString()
                    }
                }),
            },
            folder: folder
        }
    }
}

export const deflatLayerTree = (
    features: OWSResource[] = [], 
    capabilities: WmsCapabilitites, 
    node?: WmsLayer,
    parentFolder?: string
): OWSResource[] => {

    if (node === undefined){
        // first run of the recursion; get the root node
        features.push(layerToFeature(capabilities, capabilities.rootLayer, `/${capabilities.rootLayer}`))
    } else {
        const newSubFolder = `${parentFolder}/${capabilities.rootLayer}`
        features.push(layerToFeature(capabilities, node, newSubFolder))
        node.children?.forEach(subnode => {
            features.push(...deflatLayerTree(features, capabilities, subnode, newSubFolder))
        })
    }

    return features
}

export const wmsToOWSContext = (capabilities: WmsCapabilitites): OWSContext =>  {

    const contextDoc = OWSContextDocument()
    contextDoc.features = deflatLayerTree(
        [],
        capabilities, 
        undefined,
    )

    return contextDoc
}