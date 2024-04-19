import { WmsCapabilitites, WmsLayer } from "../XMLParser/types";
import { OWSContext, OWSResource, StyleSet, TreeifiedOWSResource } from "./types";

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
            offering: [{
                code: "http://www.opengis.net/spec/owc-geojson/1.0/req/wms",
                operations: [
                    {
                        code: "GetCapabilitites",
                        href: capabilities.operationUrls.getCapabilities.get,
                        method: "GET",
                        type: "application/xml"
                    },
                    {
                        code: "GetMap",
                        href: prepareGetMapUrl(capabilities, node).toString(),
                        method: "GET",
                        type: "image/png"
                    },
                    // todo: add GetFeatureInfo url
                ],
                ...(node.styles && {
                    styles: node.styles?.map((style): StyleSet => {
                        return {
                            name: style.metadata.name,
                            title: style.metadata.title,
                            abstract: style.metadata.abstract,
                            legendURL: style.legendUrl?.href.toString()
                        }
                    })
                }),
            }],
            folder: folder
        }
    }
}


export const deflatLayerTree = (
    features: OWSResource[], 
    capabilities: WmsCapabilitites, 
    node?: WmsLayer,
    parentFolder?: string
): OWSResource[] => {

    let _node: WmsLayer= node ?? capabilities.rootLayer
    let folder = node === undefined ? `/${capabilities.rootLayer.metadata.name}` : `${parentFolder}/${_node.metadata.name}`
    
    features.push(layerToFeature(capabilities, _node, folder))

    // iterate children if they exists
    _node.children?.forEach(subnode => {
        subnode !== undefined && deflatLayerTree(features, capabilities, subnode, folder)
    })
    
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

export const treeify = (context: OWSContext): TreeifiedOWSResource[] => {
    const trees: TreeifiedOWSResource[] = []

    context.features.forEach(feature => {
      // by default the order of the features array may be used to visualize the layer structure.
      // if there is a folder attribute setted; this should be used and overwrites the array order
      // feature.properties.folder && jsonpointer.set(trees, feature.properties.folder, feature)
      
      const folders = feature.properties.folder?.split('/').splice(1)
      const depth = folders?.length ? folders.length - 1: 0 -1 // -1 is signals unvalid folder definition

      if (depth === 0){
        // root node
        trees.push({...feature, children: []})
      } else {
        // find root node first
        let node = trees.find(tree => tree.properties.folder === `/${folders?.[0]}`)
        
        if (node === undefined) {
            throw new Error('parsingerror... the context is not well ordered.')
        }
        
        for (let currentDepth = 2; currentDepth <= depth; currentDepth++){
          const currentSubFolder = `/${folders?.slice(0, currentDepth).join('/')}`
          node = node.children.find(n => n.properties.folder === currentSubFolder)
          if (node === undefined) {
            throw new Error('parsingerror... the context is not well ordered.')
          }
        }
        node.children.push({...feature, children: []})
      }
    })

    return trees
}