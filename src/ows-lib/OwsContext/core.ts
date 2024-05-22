import { BBox, Geometry } from 'geojson';

import { parseWms } from '../XMLParser/parseCapabilities';
import { Position } from './enums';
import { OWSContext as IOWSContext, OWSResource as IOWSResource, OWSContextProperties, OWSResourceProperties } from './types';
import { checkFamilyPath, updateFolders, wmsToOWSResources } from './utils';


const VALID_PATH = new RegExp('(\/\d*)+')


export class OWSResource implements IOWSResource {
  properties: OWSResourceProperties;
  geometry?: Geometry;
  type: 'Feature';
  id?: string | number;
  bbox?: BBox;
  owsContext: OWSContext;

  constructor(
    owsContext: OWSContext,
    properties: OWSResourceProperties,
    id: string | number = Date.now().toString(),
    bbox: BBox | undefined = undefined,
  ) {
    this.properties = properties
    this.id = id
    this.bbox = bbox
    this.type = 'Feature'
    this.owsContext = owsContext
  }

  activateFeature(active: boolean = true){
    this.properties.active = active
    // activate/deactivate all descendants
    this.getDescandants(true).forEach(descendant => descendant.properties.active = active)

    // set parent also active if all siblings of target are active
    if (active === true && this.getSiblings().every(feature => feature.properties.active === true)){
        const parent = this.getParent()
        if (parent !== undefined) {
            parent.properties.active = active
        }
    }
    // deactivate parent to prevent from parend layer using for getmap calls etc.
    else if (active === false) {
        this.getAncestors().forEach(ancestor => ancestor.properties.active = active)
    }
    return this.owsContext.features
  }
  
  isActiveStateIndeterminate = () => {
    const descendants = this.getDescandants()
    return !this.properties.active && descendants.length > 0 && descendants.find(feature => feature.properties.active === true) !== undefined
  }

  isLeafNode(){
    const anyChild = this.owsContext.features.find(node => node.properties.folder!==this.properties.folder && checkFamilyPath(this, node))
    return anyChild === undefined
  }

  getNodeFolderIndex(){
    return Number(this.properties.folder?.split('/').slice(-1)[0])
  }

  getParentFolder = () => {
    if (this.properties.folder?.split('/').length === 2) return // root node
    return this.properties.folder?.split('/').slice(0, -1).join('/')
  }

  isParentOf(child: OWSResource){
      return this.properties.folder !== undefined &&
      child.properties.folder !== undefined &&
      this.isAncestorOf(child) && 
      this.properties.folder?.split('/').length === child.properties.folder?.split('/').length - 1
  }

  getParent(){
    if (this.properties.folder === undefined) return
    const parentFolderName = this.getParentFolder()
    if (parentFolderName === undefined || parentFolderName === '/') return
    return this.owsContext.features.find(feature => feature.properties.folder === parentFolderName)
  }

  isDescendantOf(ancestor: OWSResource){
    return checkFamilyPath(ancestor, this)
  }

  getDescandants(includeSelf: boolean = false){
    const descendants = this.owsContext.features.filter(feature => this.isAncestorOf(feature))
    if (includeSelf) return [this, ...descendants]
    return descendants
}

  isAncestorOf(descendant: OWSResource){
      return checkFamilyPath(this, descendant)
  }

  getAncestors(include_self: boolean = false){
      const ancestors = this.owsContext.features.filter(feature => this.isDescendantOf(feature))
      if (include_self) return [...ancestors, this]
      return ancestors
  }

  isChildOf(parent: OWSResource){
      return parent.properties.folder !== undefined &&
      this.properties.folder !== undefined &&
      this.isDescendantOf(parent) && 
      this.properties.folder?.split('/').length === parent.properties.folder?.split('/').length + 1
  }

  getFirstChild(){
    return this.getDescandants().find((descendant) => descendant.isChildOf(this))
  }

  getFirstChildIndex(){
      const firstChild = this.getFirstChild()
      if (firstChild === undefined) return -1
      return this.owsContext.features.indexOf(firstChild)
  }

  getLastChild(){
      return this.getDescandants().findLast((descendant) => descendant.isChildOf(this))
  }

  getLastChildIndex(){
      const lastChild = this.getLastChild()
      if (lastChild === undefined) return -1
      return this.owsContext.features.indexOf(lastChild)
  }

  isSiblingOf(sibling: OWSResource){
      return this.properties.folder !== undefined &&
      sibling.properties.folder !== undefined &&
      this.properties.folder.split('/').length >= 2 &&
      sibling.properties.folder.split('/').length >= 2 &&
      this.getParentFolder() === sibling.getParentFolder() &&
      this !== sibling
  }

  getSiblings(include_self=false, withSubtrees=false){
      const parentFolder = this.getParentFolder()?.replace('/', '\\/') ?? ''
      const regex = withSubtrees ? `^${parentFolder}(\\/\\d+)+$`: `^${parentFolder}(\\/\\d+){1}$`

      return this.owsContext.features.filter(node => {
          if (!include_self) {
              if (this.isAncestorOf(node)) return false
          }
          return node.properties.folder && new RegExp(regex).test(node.properties.folder) 
      })
  }

  getRightSiblings(include_self=false, withSubtrees=false){
    if (this.properties.folder === undefined) return []
    const sourceIndexNumber = this.getNodeFolderIndex()
    const sourceNodeIndexPosition = this.properties.folder.split('/').length - 1

    return this.getSiblings(include_self, withSubtrees).filter(feature => {
        if (feature.properties.folder === undefined) return false

        const featureFolders = feature.properties.folder.split('/')
        const featureIndexNumber = Number(featureFolders[sourceNodeIndexPosition])

        return include_self ? 
            featureIndexNumber >= sourceIndexNumber:  
            featureIndexNumber > sourceIndexNumber
    })
  }

  remove(){
    const targetSubtree = this.getDescandants(true)
    const start = this.owsContext.features.indexOf(targetSubtree[0])
    const stop = this.owsContext.features.indexOf(targetSubtree[targetSubtree.length - 1])
    
    this.owsContext.features.splice(start, stop-start + 1)
    
    updateFolders(this.owsContext.features)

    return this.owsContext.features
  }

  moveFeature(target: OWSResource,  position: Position = Position.lastChild): OWSResource[] {
    if (target.properties.folder === undefined ||
        this.properties.folder === undefined ||
        this === target
    ) return this.owsContext.features

    this.owsContext.validateFolderStructure()

    // first of all, get the objects before manipulating data. 
    // All filter functions will retun subsets with shallow copys
    const currentSourceSubtree = this.getDescandants(true)
    const currentSourceSiblings = this.getSiblings(false, false)
    const currentSourceSiblingtrees = this.getSiblings(false, true)

    const currentSourceParentFolder = this.getParentFolder() ?? '/'
    const currentSourceFolders = currentSourceSubtree.map(node => node.properties.folder).filter(folder=>folder!== undefined)
    
    const futureSiblings = target.getDescandants(false).filter(descendant => !currentSourceFolders.includes(descendant.properties.folder))
    
    const currentTargetRightSiblingsIncludeSelf = target.getRightSiblings(true, true).filter(feature => !currentSourceSubtree.includes(feature))
    const currentTargetRightSiblings = target.getRightSiblings(false, true).filter(feature => {
        return !currentSourceSubtree.includes(feature)
    })

    if (position === Position.left){
        const targetIndex = target.getNodeFolderIndex()
        const newStartIndex = targetIndex || 0

        // move source subtrees to target position
        updateFolders(currentSourceSubtree, target.getParentFolder() ?? '', newStartIndex)

        // shift all right siblings of target one to the right (make some space for source tree to insert it)
        const nextRightStartIndex = currentTargetRightSiblingsIncludeSelf[0] !== undefined ? currentTargetRightSiblingsIncludeSelf[0].getNodeFolderIndex() + 1: target.getLastChildIndex() + 1
        if (nextRightStartIndex === undefined) return this.owsContext.features
        updateFolders(currentTargetRightSiblingsIncludeSelf, target.getParentFolder() ?? '', nextRightStartIndex)       

    } else if (position === Position.right){     
        const targetIndex = target.getNodeFolderIndex()
        const newStartIndex = targetIndex ? targetIndex + 1: 1

        if (currentTargetRightSiblings[0] && currentTargetRightSiblings[0].getNodeFolderIndex() - 1 === newStartIndex) return this.owsContext.features // same position... nothing to do here
        
        // shift all right siblings of target one to the right (make some space for source tree to insert it)
        const nextRightStartIndex = currentTargetRightSiblings[0] !== undefined ? currentTargetRightSiblings[0].getNodeFolderIndex() + 1: target.getLastChildIndex() + 1
        if (nextRightStartIndex === undefined) return this.owsContext.features
        updateFolders(currentTargetRightSiblings, target.getParentFolder() ?? '', nextRightStartIndex)      

        // shift source siblings one to the left (only needed if the source is removed as sibling)
        if (!this.isSiblingOf(target)) {
            updateFolders(currentSourceSiblingtrees, currentSourceParentFolder, )
        }

        // move source tree to new position
        updateFolders(currentSourceSubtree, target.getParentFolder() ?? '', newStartIndex)

    } else if (position === Position.lastChild) {
        // shift siblings to setup an ascending folder structure without spaces
        updateFolders(currentSourceSiblings, currentSourceParentFolder)
        // move source subtree to target position
        const lastChildFolderName = target.getLastChildIndex()
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

    this.owsContext.sortFeaturesByFolder()
    this.owsContext.validateFolderStructure()
    return this.owsContext.features
  }


}


export class OWSContext implements IOWSContext{

  id: string;
  properties: OWSContextProperties;
  bbox?: BBox;
  date?: string;
  features: OWSResource[];
  type: 'FeatureCollection';

  constructor(
    id: string = Date.now().toString(),
    language: string = 'en',
    title: string = 'mrmap ows context',
    features: OWSResource[] = []
  ) {
    this.id = id;
    this.type = "FeatureCollection",
    this.properties = {
      lang: language,
      title: title,
      updated: new Date().toISOString()
    },
    this.features = features
  }

  appendWms(capabilitites: string): IOWSContext {
    const parsedWms = parseWms(capabilitites)
    const additionalFeatures = wmsToOWSResources(parsedWms, this.getNextRootId()).map(resource => new OWSResource(this, resource.properties))
    this.features.push(...additionalFeatures)
    return this
  }

  appendWfs(capabilities: string): IOWSContext {
    throw new Error('Method not implemented.');
  }
  
  findResourceByFolder(folder: string){
    return this.features.find(feature => feature.properties.folder === folder)
  }

  getNextRootId(): number {
    let nextRootId = 0
    this.features.filter(feature => feature.properties.folder && feature.properties.folder.split('/').length === 2).forEach(rootNode => {
        const rootFolder = parseInt(rootNode.properties.folder?.split('/')[1] ?? '-1')
        if (rootFolder === nextRootId){
            nextRootId = rootFolder + 1
        }
    })
    return nextRootId
  }

  insertFeature(target: OWSResource, newResource: IOWSResource, position: Position = Position.lastChild){

    const resource = new OWSResource(this, newResource.properties, newResource.id, newResource.bbox)

    if (position === Position.left) {
        resource.properties.folder = target.properties.folder
        const targetIndex = this.features.indexOf(target)

        const rightSubtrees = target.getRightSiblings(true, true)
        const currentTargetNodeFolderIndex = target.getNodeFolderIndex()
        const currentParentFolder = target.getParentFolder()
        
        updateFolders(rightSubtrees, currentParentFolder, currentTargetNodeFolderIndex + 1)

        // insert before target
        this.features.splice(targetIndex, 0, resource)
        

    } else if (position === Position.right) {

        const lastChild = target.getLastChild()
        if (lastChild === undefined) return
        const lastChildIndex = this.features.indexOf(lastChild)
        const rightSubtrees = target.getRightSiblings(false, true)
        const currentParentFolder = target.getParentFolder()
        const currentTargetNodeFolderIndex = target.getNodeFolderIndex()

        // setup as right sibling
        resource.properties.folder = `${target.getParentFolder()}/${currentTargetNodeFolderIndex + 1}`

        // move all right siblings of target one step right
        updateFolders(rightSubtrees, currentParentFolder, currentTargetNodeFolderIndex + 2)

        // insert after target
        this.features.splice(lastChildIndex + 1, 0, resource)

    } else if (position === Position.firstChild) {
        const targetIndex = this.features.indexOf(target)
        const targetDescendants = target.getDescandants()
        const targetFolder = target.properties.folder

        resource.properties.folder = targetDescendants[0].properties.folder
        // insert after target
        this.features.splice(targetIndex+1, 0, resource)

        // move all siblings of the new feature one step right
        updateFolders(targetDescendants, targetFolder, 1)
        
    } else if (position === Position.lastChild) {
        const currentLastChild = target.getLastChild()
        if (currentLastChild === undefined) return

        const currentLastChildIndex = this.features.indexOf(currentLastChild)
        const currentLastChildNodeFolderIndex = currentLastChild.getNodeFolderIndex()

        resource.properties.folder = `${currentLastChild.getParentFolder()}/${currentLastChildNodeFolderIndex + 1}`

        // insert after currentLastChild
        this.features.splice(currentLastChildIndex+1, 0, resource)
    }

    this.validateFolderStructure()
  }


  sortFeaturesByFolder(){
    this.features.sort((a, b) => {
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
    return this.features
  }

  getLeafNodes(){
    return this.features.filter(feature => feature.isLeafNode())
  }

  validateFolderStructure(): boolean {
    let previousFeature: OWSResource

    this.features.forEach((feature, index)=>{
        if (feature === undefined) throw new Error(`feature with index ${index} was undefined`)
        const folder = feature.properties.folder
        if (folder === undefined) throw new Error(`feature ${index} has an undefined folder`)
        if (!VALID_PATH.test(folder)) throw new Error(`folder of feature ${index} value does not match the regex: ${folder}`)
        
        if (index === 0) {
            if (folder !== '/0') throw new Error(`first feature must be /0. It was: ${folder}`)
            previousFeature = feature
            return
        }
        
        if (feature.isChildOf(previousFeature)) {
            if (feature.getNodeFolderIndex() !== 0) throw new Error(`first child must always start with index 0. It was ${feature.getNodeFolderIndex()}; Path: ${folder}, previous ${previousFeature.properties.folder}; loop idx: ${index}`)
            previousFeature = feature
            return
        }
        
        if (feature.isSiblingOf(previousFeature)){
            if (previousFeature.getNodeFolderIndex() + 1 !== feature.getNodeFolderIndex()) throw new Error(`index of following siblings must be increase strict by 1. Index: ${index}; Folder: ${folder}, prevFolder: ${previousFeature.properties.folder}`)
            previousFeature = feature
            return
        }

        // last but not least, it can only be the next sibling of any parent
        const parentFolder = previousFeature.getParentFolder() 
        const pathParts = parentFolder?.split('/').filter(part => part !== '');

        let siblingFound = false

        // Iteriere über die Teile des Pfads
        for (let i = pathParts?.length ?? 0; i > 0; i--) {
            const partialPath = '/' + pathParts?.slice(0, i).join('/')
            const parentResource = this.findResourceByFolder(partialPath)
            if (parentResource && feature.isSiblingOf(parentResource)) {
                siblingFound = true
                break
            }
        }

        if (!siblingFound){
            throw new Error(`feature with index ${index} has no previous sibling.`)
        }
        previousFeature = feature
    })

    return true
}

}


