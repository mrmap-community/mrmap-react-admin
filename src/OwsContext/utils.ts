import { WmsCapabilitites, WmsLayer } from "../XMLParser/types";
import { Position } from "./enums";
import { OWSContext, OWSResource, StyleSet, TreeifiedOWSResource } from "./types";
import {v4 as uuidv4} from 'uuid';

export const OWSContextDocument = (
    id: string = uuidv4(),
    language: string = 'en',
    title: string = 'mrmap ows context',
    features: OWSResource[] = []
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

export const layerToFeature = (capabilities: WmsCapabilitites, node: WmsLayer, folder: string): OWSResource => {
    
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
    features: OWSResource[], 
    capabilities: WmsCapabilitites, 
    parentFolder: string,
    currentIndex: number,
    node?: WmsLayer,
): OWSResource[] => {

    const _node: WmsLayer= node ?? capabilities.rootLayer

    const folder = `${parentFolder}/${currentIndex}`
    features.push(layerToFeature(capabilities, _node, folder))

    // iterate children if they exists
    _node.children?.forEach((subnode, index) => {
        subnode !== undefined && deflatLayerTree(features, capabilities, folder, index, subnode )
    })
    
    return features
}

export const wmsToOWSResources = (capabilities: WmsCapabilitites, treeId: number = 0): OWSResource[] =>  {
    return deflatLayerTree(
        [],
        capabilities,
        '',
        treeId,
        undefined
    )
}

export const getNextRootId = (features: OWSResource[]) => {
    let nextRootId = 0
    features.filter(feature => feature.properties.folder && feature.properties.folder.split('/').length === 2).forEach(rootNode => {
        const rootFolder = parseInt(rootNode.properties.folder?.split('/')[1] ?? '-1')
        if (rootFolder === nextRootId){
            nextRootId = rootFolder + 1
        }
    })
    return nextRootId
}

export const treeify = (features: OWSResource[]): TreeifiedOWSResource[] => {
    const trees: TreeifiedOWSResource[] = []

    features.forEach(feature => {
      // by default the order of the features array may be used to visualize the layer structure.
      // if there is a folder attribute setted; this should be used and overwrites the array order
      // feature.properties.folder && jsonpointer.set(trees, feature.properties.folder, feature)
      
      const folders = feature.properties.folder?.split('/').splice(1)
      const depth = folders?.length ? folders.length - 1: 0 -1 // -1 is signals unvalid folder definition

      if (depth === 0){
        // root node
        trees.push({...feature, id: uuidv4(), children: []})
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

export const getParentFolder = (child: OWSResource) => {
    if (child.properties.folder?.split('/').length === 2) return // root node
    return child.properties.folder?.split('/').slice(0, -1).join('/')
}

export const getParent = (context: OWSContext, child: OWSResource) => {
    if (child.properties.folder === undefined) return
    const parentFolderName = getParentFolder(child)
    if (parentFolderName === undefined || parentFolderName === '/') return
    return context.features.find(feature => feature.properties.folder?.startsWith(parentFolderName))
}

export const isDescendantOf = (descendant: OWSResource, ancestor: OWSResource) => {
    return ancestor.properties.folder !== undefined && 
    descendant.properties.folder !== undefined  &&
    descendant.properties.folder.split('/').length > ancestor.properties.folder.split('/').length &&
    descendant.properties.folder.startsWith(ancestor.properties.folder)
}

export const isAncestorOf = (ancestor: OWSResource, descendant: OWSResource) => {
    return descendant.properties.folder !== undefined &&
    ancestor.properties.folder !== undefined &&
    ancestor.properties.folder.length !== descendant.properties.folder.length &&
    descendant.properties.folder.startsWith(ancestor.properties.folder)
}

export const isParentOf = (parent: OWSResource, child: OWSResource) => {
    return parent.properties.folder !== undefined &&
    child.properties.folder !== undefined &&
    isAncestorOf(parent, child) && 
    parent.properties.folder?.split('/').length === child.properties.folder?.split('/').length - 1
}

export const isChildOf = (child: OWSResource, parent: OWSResource) => {
    return parent.properties.folder !== undefined &&
    child.properties.folder !== undefined &&
    isDescendantOf(child, parent) && 
    child.properties.folder?.split('/').length === parent.properties.folder?.split('/').length + 1
}

export const isSiblingOf = (siblingA: OWSResource, siblingB: OWSResource) => {

    return siblingA.properties.folder !== undefined &&
    siblingB.properties.folder !== undefined &&
    siblingA.properties.folder.split('/').length > 2 &&
    siblingB.properties.folder.split('/').length > 2 &&
    getParentFolder(siblingA)  === getParentFolder(siblingB)
}

export const getDescandants = (features: OWSResource[], ancestor: OWSResource, includeSelf: boolean = false) => {
    const descendants = [...features.filter(feature => isDescendantOf(feature, ancestor))]
    if (includeSelf) return [ancestor, ...descendants]
    return descendants
}

export const getFirstChildIndex = (context: OWSContext, parent: OWSResource) => {
    return context.features.findIndex((child) => isChildOf(child, parent))
}

export const getLastChildIndex = (context: OWSContext, parent: OWSResource) => {
    return context.features.findLastIndex((child) => isChildOf(child, parent))
}




export const sortFeaturesByFolder = (context: OWSContext) => {
    context.features.sort((a, b) =>  a.properties.folder?.localeCompare(b.properties.folder ?? '') ?? -1)
    return context
}

export const handleFirstChildMove = (context: OWSContext, feature: OWSResource, target: OWSResource) => {
    if (target.properties.folder === undefined) return
    
    const folderPathToBeReplaced = getParentFolder(feature)
    if (folderPathToBeReplaced === undefined) return
    const regex = new RegExp(`^${folderPathToBeReplaced}+`)
    const parentFolder = target.properties.folder

    getDescandants(context.features, feature, true).forEach(node => {
        node.properties.folder = node.properties.folder?.replace(regex, parentFolder)
    })
}


export const moveFeature = (context: OWSContext, feature: OWSResource, target: OWSResource, position: Position = Position.lastChild) => {
    if (feature.properties.folder === undefined || target.properties.folder === undefined) return

    const folderPathToBeReplaced = getParentFolder(feature)
    if (folderPathToBeReplaced === undefined) return
    
    if (position === Position.lastChild){
        handleFirstChildMove(context, feature, target)
    } else if (position === Position.firstChild) {
        
        
        const index = getFirstChildIndex(context, target)
        if (index === -1) {
            /** can not find any child of the current target. 
            *   In this case we can append the subtree as its first child
            */
            handleFirstChildMove(context, feature, target)
        } else {
            /** there is a child
             *  In this case we need to shift the complete child tree (exluding the moving subtree); 
             *  and replacing the old parent path with the new
             */
            const movingSubtree = getDescandants(context.features, feature, true)
            const movingSubtreeFolders = movingSubtree.map(node => node.properties.folder)

            const shiftingSubtree = context.features.slice(index).filter(node => !movingSubtreeFolders.includes(node.properties.folder))
            
            const indexToBeIncresed = target.properties.folder.length + 1

            shiftingSubtree.forEach(node => {
                if (node.properties.folder === undefined) return
                const folderPaths = node.properties.folder.split('/')
                folderPaths[indexToBeIncresed] = (Number(folderPaths[indexToBeIncresed]) + 1).toString()
                node.properties.folder = folderPaths.join('/')
            })

            // TODO: replace old parent with new for the complete movingSubtree

            
        }



    }

    return sortFeaturesByFolder(context)
}
