import { WmsCapabilitites, WmsLayer } from "../XMLParser/types";
import { OWSResource as IOWSResource, OWSContext, StyleSet, TreeifiedOWSResource } from "./types";


export const OWSContextDocument = (
    id: string = Date.now().toString(),
    language: string = 'en',
    title: string = 'mrmap ows context',
    features: IOWSResource[] = []
): OWSContext => {

    return {
        id: id,
        type: "FeatureCollection",
        properties: {
            lang: language,
            title: title,
            updated: new Date().toISOString()
        },
        features: features,
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

export const layerToFeature = (capabilities: WmsCapabilitites, node: WmsLayer, folder: string): IOWSResource => {
    
    return {
        type: "Feature",
        properties: {
            title: node.metadata.title,
            updated: new Date().toISOString(),
            ...(node.metadata.name !== undefined && {
                offerings: [{
                    code: "http://www.opengis.net/spec/owc/1.0/req/wms",
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
                ...(node.minScaleDenominator && {minscaledenominator: node.minScaleDenominator}),
                ...(node.maxScaleDenominator && {maxscaledenominator: node.maxScaleDenominator})
            }),
            folder: folder
        }
    }
}


export const deflatLayerTree = (
    features: IOWSResource[], 
    capabilities: WmsCapabilitites, 
    parentFolder: string,
    currentIndex: number,
    node?: WmsLayer,
): IOWSResource[] => {

    const _node: WmsLayer= node ?? capabilities.rootLayer

    const folder = `${parentFolder}/${currentIndex}`
    features.push(layerToFeature(capabilities, _node, folder))

    // iterate children if they exists
    _node.children?.forEach((subnode, index) => {
        subnode !== undefined && deflatLayerTree(features, capabilities, folder, index, subnode )
    })
    
    return features
}

export const wmsToOWSResources = (capabilities: WmsCapabilitites, treeId: number = 0): IOWSResource[] =>  {
    return deflatLayerTree(
        [],
        capabilities,
        '',
        treeId
    )
}

export const treeify = (features: IOWSResource[]): TreeifiedOWSResource[] => {
    const trees: TreeifiedOWSResource[] = []

    JSON.parse(JSON.stringify(features)).forEach((feature: IOWSResource) => {
      // by default the order of the features array may be used to visualize the layer structure.
      // if there is a folder attribute setted; this should be used and overwrites the array order
      // feature.properties.folder && jsonpointer.set(trees, feature.properties.folder, feature)
      
      const folders = feature.properties.folder?.split('/').splice(1)
      const depth = folders?.length ? folders.length - 1: 0 -1 // -1 is signals unvalid folder definition

      if (depth === 0){
        // root node
        trees.push({...feature, id: Date.now().toString(), children: []})
      } else {
        // find root node first
        let node = trees.find(tree => tree.properties.folder === `/${folders?.[0]}`)
        
        // TODO: just create a new node if it wasnt find
        if (node === undefined) {
            throw new Error('parsingerror... the context is not well ordered.')
        }
        
        for (let currentDepth = 2; currentDepth <= depth; currentDepth++){
          const currentSubFolder = `/${folders?.slice(0, currentDepth).join('/')}`
          node = node.children.find(n => n.properties.folder === currentSubFolder)
          if (node === undefined) {
            // TODO: just create a new node if it wasnt find
            throw new Error('parsingerror... the context is not well ordered.')
          }
        }
        node.children.push({...feature, children: []})
      }
    })

    return trees
}

export const treeToList = (node: TreeifiedOWSResource) => {
    const flatNodes = [node]
    if (node.children.length > 0) {
        node.children.forEach(child => flatNodes.push(...treeToList(child)))
    }
    return flatNodes
}

export const isGetMapUrlEqual = (url1: URL, url2:URL): boolean =>  {
    if (url1 === undefined || url2 === undefined) return false
    return (url1.origin === url2.origin) &&
    (url1.pathname === url2.pathname) &&
    ((url1.searchParams.get('SERVICE') ?? url1.searchParams.get('service')) === (url2.searchParams.get('SERVICE') ?? url2.searchParams.get('service'))) &&
    ((url1.searchParams.get('VERSION') ?? url1.searchParams.get('version')) === (url2.searchParams.get('VERSION') ?? url2.searchParams.get('version')))
}

export const appendLayerIdentifiers = (url1: URL, url2: URL) => {
    const layerIdentifiers1 = (url1.searchParams.get('LAYERS') ?? url1.searchParams.get('layers'))?.split(',') ?? []
    const layerIdentifiers2 = (url2.searchParams.get('LAYERS') ?? url2.searchParams.get('layers'))?.split(',') ?? []
    
    const newLayersParam = layerIdentifiers1?.concat(layerIdentifiers2)

    url1.searchParams.has('LAYERS') && url1.searchParams.set('LAYERS', newLayersParam?.join(','))
    url1.searchParams.has('layers') && url1.searchParams.set('layers', newLayersParam?.join(','))
}

/** Calculates the groupable GetMap request
 * by comparing the basis GetMap href and the folder structure
 */
export const getOptimizedGetMapUrls = (trees: TreeifiedOWSResource[]) => {
    

    const getMapUrls: URL[] = []
    
    /** 
     * every tree is 1..* atomic wms
     */
    trees.forEach((tree) => {
      const activeWmsFeatures = treeToList(tree).filter(feature => feature.properties.offerings?.find(offering => offering?.code === 'http://www.opengis.net/spec/owc/1.0/req/wms') && feature.properties.active)
      activeWmsFeatures.forEach((feature, index) => {

        const wmsOffering = feature.properties.offerings?.find(offering => 
            offering.code === 'http://www.opengis.net/spec/owc/1.0/req/wms')?.operations?.find(operation => 
              operation.code === 'GetMap' && operation.method.toLowerCase() === 'get')
      
        if (wmsOffering?.href === undefined) return
        
        const getMapUrl = new URL(wmsOffering.href)
        const lastUrl = getMapUrls.slice(-1)?.[0]

        if (index === 0 || !isGetMapUrlEqual(lastUrl, getMapUrl)){
            // index 0 signals always a root node ==> just push it; nothing else to do here
            // index > 0 and last url not equals current => define new atomic wms; not mergeable resources
            getMapUrls.push(getMapUrl)
        }
        else if (isGetMapUrlEqual(lastUrl, getMapUrl)) {
            appendLayerIdentifiers(lastUrl, getMapUrl)
        } 
      })
    })
    return getMapUrls
}

export const isDescendant = (ancestor: IOWSResource, descendant: IOWSResource) => {
    const ancestorFolders = ancestor.properties.folder?.split('/') ?? []
    const descendantFolders = descendant.properties.folder?.split('/') ?? []
    return ancestorFolders.length < descendantFolders.length && ancestorFolders?.every((folder, index) => descendantFolders?.[index] === folder)
}

export const updateFolders = (
    tree: IOWSResource[], 
    newRootPath: string = '',
    startIndex: number = 0) => {
    if (tree[0]?.properties.folder === undefined) return

    const newRootFolders = newRootPath.split('/')
    const oldRootFolders = tree[0].properties.folder.split('/')

    const subtreeDepthIndexes: any = {'0': startIndex }
    
    let lastDepth = 0

    tree.forEach((node) => {
        if (node.properties.folder === undefined) return

        const nodeFolders = node.properties.folder.split('/')
        const currentDepth = nodeFolders.length - oldRootFolders.length

        if (lastDepth > currentDepth){
            // we climb up the tree. In that case the lastDepth index need to be reseted
            subtreeDepthIndexes[lastDepth.toString()] = 0
        }

        if (!subtreeDepthIndexes.hasOwnProperty(currentDepth.toString())){
            // set starting index if not exist
            subtreeDepthIndexes[currentDepth.toString()] = 0
        }
        
        // initial with one empty string to get a leading / after joining
        const newNodeFolders = [...newRootFolders]

        // iterate over all depths and set correct index
        for (let depth = 0; depth <= currentDepth; depth++) {
            
            let index
            if (currentDepth === depth){
                index = subtreeDepthIndexes[depth.toString()]; 
            } else {
                index = subtreeDepthIndexes[depth.toString()] - 1; // reduce by 1 cause the cache stores incremented values
            }
            newNodeFolders.push(index.toString())
           
        }
        subtreeDepthIndexes[currentDepth.toString()] ++
        lastDepth = currentDepth
        node.properties.folder = newNodeFolders.join('/')
    })
    
}

export const getFeatureFolderIndex = (feature: IOWSResource) => {
    return Number(feature.properties.folder?.split('/').slice(-1)[0])
}

