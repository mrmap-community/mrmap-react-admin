import { OWSResource } from "./types";
import { getNodeIndex, getParentFolder, isChildOf, isSiblingOf } from "./utils";

const VALID_PATH = new RegExp('(\/\d*)+')

export const validateFolderStructure = (features: OWSResource[]): boolean => {
    let previousFeature: OWSResource
    let lastTreeId

    features.forEach((feature, index)=>{
        if (feature === undefined) throw new Error(`feature with index ${index} was undefined`)
        const folder = feature.properties.folder
        if (folder === undefined) throw new Error(`feature ${index} has an undefined folder`)
        if (!VALID_PATH.test(folder)) throw new Error(`folder of feature ${index} value does not match the regex: ${folder}`)
        
        if (index === 0) {
            if (folder !== '/0') throw new Error(`first feature must be /0. It was: ${folder}`)
            previousFeature = feature
            lastTreeId = 0
            return
        }
        
        if (isChildOf(feature, previousFeature)) {
            if (getNodeIndex(feature) !== 0) throw new Error(`first child must always start with index 0. It was ${getNodeIndex(feature)}; Path: ${folder}, previous ${previousFeature.properties.folder}; loop idx: ${index}`)
            previousFeature = feature
            return
        }
        
        if (isSiblingOf(feature, previousFeature)){
            if (getNodeIndex(previousFeature) + 1 !== getNodeIndex(feature)) throw new Error(`index of following siblings must be increase strict by 1. Index: ${index}; Folder: ${folder}, prevFolder: ${previousFeature.properties.folder}`)
            previousFeature = feature
            return
        }

        // last but not least, it can only be the next sibling of any parent
        const parentFolder = getParentFolder(previousFeature) 
        const pathParts = parentFolder.split('/').filter(part => part !== '');

        let siblingFound = false

        // Iteriere über die Teile des Pfads
        for (let i = pathParts.length; i > 0; i--) {
            const partialPath = '/' + pathParts.slice(0, i).join('/')
            const parentFeature: OWSResource = {
                type: 'Feature',
                properties: {
                    title: '',
                    updated: '',
                    folder: partialPath
                }
            }
            const isSibling = isSiblingOf(
                    feature,
                    parentFeature,
                )
            if (isSibling) {
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