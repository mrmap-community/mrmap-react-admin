import { isString } from "lodash";
import _ from "lodash";
import {v4 as uuidv4} from 'uuid';

import { WmsCapabilitites, WmsLayer } from "../XMLParser/types";
import { Position } from "./enums";
import { OWSContext, OWSResource, StyleSet, TreeifiedOWSResource } from "./types";
import { validateFolderStructure } from "./validator";

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
        treeId
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

    JSON.parse(JSON.stringify(features)).forEach((feature: OWSResource) => {
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

export const getParentFolder = (child: OWSResource | string) => {
    const childFolder = isString(child) ? child: child.properties.folder

    if (childFolder?.split('/').length === 2) return // root node
    return childFolder?.split('/').slice(0, -1).join('/')
}

export const getParent = (features: OWSResource[], child: OWSResource) => {
    if (child.properties.folder === undefined) return
    const parentFolderName = getParentFolder(child)
    if (parentFolderName === undefined || parentFolderName === '/') return
    return features.find(feature => feature.properties.folder === parentFolderName)
}

export const isDescendantOf = (descendant: OWSResource, ancestor: OWSResource) => {
    const ancestorFolders = ancestor.properties.folder?.split('/')
    const descendantFolders = descendant.properties.folder?.split('/')

    return ancestor.properties.folder !== undefined && 
    descendant.properties.folder !== undefined  &&
    descendant.properties.folder.split('/').length > ancestor.properties.folder.split('/').length &&
    ancestorFolders?.every((folder, index) => descendantFolders?.[index] === folder) 
}

export const isAncestorOf = (ancestor: OWSResource, descendant: OWSResource) => {
    const ancestorFolders = ancestor.properties.folder?.split('/')
    const descendantFolders = descendant.properties.folder?.split('/')

    return descendant.properties.folder !== undefined &&
    ancestor.properties.folder !== undefined &&
    ancestor.properties.folder.length !== descendant.properties.folder.length &&
    ancestorFolders?.every((folder, index) => descendantFolders?.[index] === folder) 
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
    siblingA.properties.folder.split('/').length >= 2 &&
    siblingB.properties.folder.split('/').length >= 2 &&
    getParentFolder(siblingA) === getParentFolder(siblingB) &&
    siblingA !== siblingB
}

export const getDescandants = (features: OWSResource[], ancestor: OWSResource, includeSelf: boolean = false) => {
    const descendants = [...features.filter(feature => isDescendantOf(feature, ancestor))]
    if (includeSelf) return [ancestor, ...descendants]
    return descendants
}

export const getFirstChild = (features: OWSResource[], parent: OWSResource) => {
    return features.find((child) => isChildOf(child, parent))
}

export const getFirstChildIndex = (context: OWSContext, parent: OWSResource) => {
    return context.features.findIndex((child) => isChildOf(child, parent))
}

export const getLastChild = (features: OWSResource[], parent: OWSResource) => {
    return features.findLast((child) => isChildOf(child, parent))
}

export const getLastChildIndex = (features: OWSResource[], parent: OWSResource) => {
    const lastChild = getLastChild(features, parent)
    if (lastChild === undefined) return -1
    return getNodeIndex(lastChild)
}

export const sortFeaturesByFolder = (features: OWSResource[]) => {
    features.sort((a, b) => {
        const pathA = a.properties.folder?.split('/').map(Number);
        const pathB = b.properties.folder?.split('/').map(Number);
        if (pathA === undefined || pathB === undefined) return -1

        for (let i = 0; i < Math.min(pathA.length, pathB.length); i++) {
            if (pathA[i] !== pathB[i]) {
                return pathA[i] - pathB[i];
            }
        }
        return pathA.length - pathB.length;
    });
    return features
}

export const checkDescendantPath = (ancestor: OWSResource, descendant: OWSResource) => {
    const ancestorFolders = ancestor.properties.folder?.split('/')
    const descendantFolders = descendant.properties.folder?.split('/')
    return ancestorFolders?.every((folder, index) => descendantFolders?.[index] === folder)
}

export const getSiblings = (features: OWSResource[], source: OWSResource, include_self=false, withSubtrees=false) => {
    
    const parentFolder = getParentFolder(source)?.replace('/', '\\/') ?? ''
    const regex = withSubtrees ? `^${parentFolder}(\\/\\d+)+$`: `^${parentFolder}(\\/\\d+){1}$`

    return features.filter(node => {
        if (!include_self) {
            if (source.properties.folder === undefined) return false
            
            if (checkDescendantPath(source, node)) return false
        }
        return node.properties.folder && new RegExp(regex).test(node.properties.folder) 
    })
}

export const getRootNodeIndex = (feature: OWSResource): number => {
    return Number(feature.properties.folder?.split('/')[0])
}

export const getNodeIndex = (feature: OWSResource): number => {
    return Number(feature.properties.folder?.split('/').slice(-1)[0])
}

export const getRightSiblings = (features: OWSResource[], source:OWSResource, include_self=false, withSubtrees=false) => {
    if (source.properties.folder === undefined) return []
    const sourceIndexNumber = getNodeIndex(source)
    const sourceNodeIndexPosition = source.properties.folder.split('/').length - 1

    return getSiblings(features, source, include_self, withSubtrees).filter(feature => {
        if (feature.properties.folder === undefined) return false

        const featureFolders = feature.properties.folder.split('/')
        const featureIndexNumber = Number(featureFolders[sourceNodeIndexPosition])

        return include_self ? 
            featureIndexNumber >= sourceIndexNumber:  
            featureIndexNumber > sourceIndexNumber
    })
}

export const getLeafNodes = (features: OWSResource[]) => {
    return features.filter(feature => isLeafNode(features, feature))
}

export const updateFolders = (
    tree: OWSResource[], 
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

export const moveFeature = (features: OWSResource[], source: OWSResource, target: OWSResource,  position: Position = Position.lastChild): OWSResource[] => {
    if (target.properties.folder === undefined ||
        source.properties.folder === undefined ||
        source === target
    ) return features

    validateFolderStructure(features)

    // first of all, get the objects before manipulating data. 
    // All filter functions will retun subsets with shallow copys
    const currentSourceSubtree = getDescandants(features, source, true)
    const currentSourceSiblings = getSiblings(features, source, false, false)
    const currentSourceSiblingtrees = getSiblings(features, source, false, true)

    const currentSourceParentFolder = getParentFolder(source) ?? '/'
    const currentSourceFolders = currentSourceSubtree.map(node => node.properties.folder).filter(folder=>folder!== undefined)
    
    const futureSiblings = getDescandants(features, target, false).filter(descendant => !currentSourceFolders.includes(descendant.properties.folder))
    
    const currentTargetRightSiblingsIncludeSelf = getRightSiblings(features, target, true, true).filter(feature => !currentSourceSubtree.includes(feature))
    const currentTargetRightSiblings = getRightSiblings(features, target, false, true).filter(feature => {
        return !currentSourceSubtree.includes(feature)
    })

    if (position === Position.left){
        const targetIndex = getNodeIndex(target)
        const newStartIndex = targetIndex || 0

        // move source subtrees to target position
        updateFolders(currentSourceSubtree, getParentFolder(target) ?? '', newStartIndex)

        // shift all right siblings of target one to the right (make some space for source tree to insert it)
        const nextRightStartIndex = currentTargetRightSiblingsIncludeSelf[0] !== undefined ? getNodeIndex(currentTargetRightSiblingsIncludeSelf[0]) + 1: getLastChildIndex(features, target) + 1
        if (nextRightStartIndex === undefined) return features
        updateFolders(currentTargetRightSiblingsIncludeSelf, getParentFolder(target) ?? '', nextRightStartIndex)       

    } else if (position === Position.right){     
        const targetIndex = getNodeIndex(target)
        const newStartIndex = targetIndex ? targetIndex + 1: 1

        if (currentTargetRightSiblings[0] && getNodeIndex(currentTargetRightSiblings[0]) - 1 === newStartIndex) return features // same position... nothing to do here
        
        // shift all right siblings of target one to the right (make some space for source tree to insert it)
        const nextRightStartIndex = currentTargetRightSiblings[0] !== undefined ? getNodeIndex(currentTargetRightSiblings[0]) + 1: getLastChildIndex(features, target) + 1
        if (nextRightStartIndex === undefined) return features
        updateFolders(currentTargetRightSiblings, getParentFolder(target) ?? '', nextRightStartIndex)      

        // shift source siblings one to the left (only needed if the source is removed as sibling)
        if (!isSiblingOf(source, target)) {
            updateFolders(currentSourceSiblingtrees, currentSourceParentFolder, )
        }

        // move source tree to new position
        updateFolders(currentSourceSubtree, getParentFolder(target) ?? '', newStartIndex)

    } else if (position === Position.lastChild) {
        // shift siblings to setup an ascending folder structure without spaces
        updateFolders(currentSourceSiblings, currentSourceParentFolder)
        // move source subtree to target position
        const lastChildFolderName = getLastChildIndex(features, target)
        const relativPosition = Number(lastChildFolderName) + 1
        updateFolders(currentSourceSubtree, target.properties.folder, relativPosition)

    } else if (position === Position.firstChild){

        if (currentSourceParentFolder !== target.properties.folder){
            // shift all current source siblings to generate gap free ascendant index structure
            // only needed if current source parent is not the same 
            updateFolders(currentSourceSiblings, currentSourceParentFolder, )
        }

        // move source subtree to target position
        updateFolders(currentSourceSubtree, target.properties.folder, 0)
        // shift all siblings subtrees behind the first child
        updateFolders(futureSiblings, target.properties.folder, 1)

        
    } 

    sortFeaturesByFolder(features)
    validateFolderStructure(features)
    return features
}

export const findNodeByFolder = (features: OWSResource[], folder: string) => {
    return features.find(feature => feature.properties.folder === folder)
}

export const isLeafNode = (features: OWSResource[], feature: OWSResource) => {
    const anyChild = features.find(node => node.properties.folder!==feature.properties.folder && checkDescendantPath(feature, node))
    return anyChild === undefined
}

export const removeFeature = (features: OWSResource[], target: OWSResource) => {
    const targetSubtree = getDescandants(features, target, true)
    const start = features.indexOf(targetSubtree[0])
    const stop = features.indexOf(targetSubtree[targetSubtree.length - 1])
    
    features.splice(start, stop-start + 1)
    
    updateFolders(features)

    return features
}

export const insertFeature = (features: OWSResource[], target: OWSResource, newFeature: OWSResource, position: Position = Position.lastChild) => {

    if (position === Position.left) {
        newFeature.properties.folder = target.properties.folder
        const targetIndex = features.indexOf(target)

        const rightSubtrees = getRightSiblings(features, target, true, true)
        const currentTargetNodeFolderIndex = getNodeIndex(target)
        const currentParentFolder = getParentFolder(target)
        
        updateFolders(rightSubtrees, currentParentFolder, currentTargetNodeFolderIndex + 1)

        // insert before target
        features.splice(targetIndex, 0, newFeature)
        

    } else if (position === Position.right) {

        const lastChild = getLastChild(features, target)
        if (lastChild === undefined) return
        const lastChildIndex = features.indexOf(lastChild)
        const rightSubtrees = getRightSiblings(features, target, false, true)
        const currentParentFolder = getParentFolder(target)
        const currentTargetNodeFolderIndex = getNodeIndex(target)

        // setup as right sibling
        newFeature.properties.folder = `${getParentFolder(target)}/${currentTargetNodeFolderIndex + 1}`

        // move all right siblings of target one step right
        updateFolders(rightSubtrees, currentParentFolder, currentTargetNodeFolderIndex + 2)

        // insert after target
        features.splice(lastChildIndex + 1, 0, newFeature)

    } else if (position === Position.firstChild) {
        const targetIndex = features.indexOf(target)
        const targetDescendants = getDescandants(features, target)
        const targetFolder = target.properties.folder

        newFeature.properties.folder = targetDescendants[0].properties.folder
        // insert after target
        features.splice(targetIndex+1, 0, newFeature)

        // move all siblings of the new feature one step right
        updateFolders(targetDescendants, targetFolder, 1)
        
    } else if (position === Position.lastChild) {
        const currentLastChild = getLastChild(features, target)
        if (currentLastChild === undefined) return

        const currentLastChildIndex = features.indexOf(currentLastChild)
        const currentLastChildNodeFolderIndex = getNodeIndex(currentLastChild)

        newFeature.properties.folder = `${getParentFolder(currentLastChild)}/${currentLastChildNodeFolderIndex + 1}`

        // insert after currentLastChild
        features.splice(currentLastChildIndex+1, 0, newFeature)
    }

    //validateFolderStructure(features)
}