import { expect, test } from 'vitest'
import { WmsCapabilitites } from '../../XMLParser/types'
import { getDescandants, getFirstChildIndex, getLastChildIndex, getParent, getParentFolder, getRightSiblings, getSiblings, isAncestorOf, isChildOf, isDescendantOf, isLeafNode, isParentOf, isSiblingOf, moveFeature, sortFeaturesByFolder, treeify, updateFolders, wmsToOWSResources } from '../utils'
import { OWSContext, OWSResource } from '../types'
import { Position } from '../enums'

import {karteRpFeatures as testdata} from './data'
import { validateFolderStructure } from '../validator'

const getOwsResource = (title:string, folder: string): OWSResource => {
    return {
        type: 'Feature', 
        properties: {
            title: title,
            updated: '',
            folder: folder}
    }
}

const getKarteRpFeatures = () => {
    return JSON.parse(JSON.stringify(testdata))
}

const getOwsContext = (): OWSContext => {
    return {
        id: 'huhu',
        type: 'FeatureCollection',
        properties: {
            lang: 'en',
            title: 'test context',
            updated: new Date().toISOString()
        },
        features: [
            // 0
            {
                type: 'Feature',
                properties: {
                    title: '/0',
                    updated: new Date().toISOString(),
                    folder: '/0'
                }
            },
            // 1
            {
                type: 'Feature',
                properties: {
                    title: '/0/0',
                    updated: new Date().toISOString(),
                    folder: '/0/0'
                }
            },
            // 2
            {
                type: 'Feature',
                properties: {
                    title: '/0/1',
                    updated: new Date().toISOString(),
                    folder: '/0/1'
                }
            },
            // 3
            {
                type: 'Feature',
                properties: {
                    title: '/0/1/0',
                    updated: new Date().toISOString(),
                    folder: '/0/1/0'
                }
            },
            // 4
            {
                type: 'Feature',
                properties: {
                    title: '/0/2',

                    updated: new Date().toISOString(),
                    folder: '/0/2'
                }
            },
            // 5
            {
                type: 'Feature',
                properties: {
                    title: '/1',

                    updated: new Date().toISOString(),
                    folder: '/1'
                }
            }
        ]
    }
}

test('wmsToOWSContext', () => {
    const capabilities: WmsCapabilitites = {
        version: '1.3.0',
        metadata: {
            name: "test wms",
            title: "test wms title"
        },
        operationUrls: {
            getCapabilities: {
                mimeTypes: ['application/xml'],
                get: 'http://example.com/?SERVICE=wms&REQUEST=GetCapabilitites'
            },
            getMap: {
                mimeTypes: ['image/png'],
                get: 'http://example.com/?SERVICE=wms&REQUEST=GetMap'
            },
        },
        rootLayer: {
            metadata: {
                name: 'node 1',
                title: 'node 1',
            },
            referenceSystems: ["EPSG:4326"],
            children: [
                {
                    metadata: {
                        name: 'node 1.1',
                        title: 'node 1.1'
                    },
                    children: [
                        {
                            metadata: {
                                name: 'node 1.1.1',
                                title: 'node 1.1.1'
                            }
                        },
                        {
                            metadata: {
                                name: 'node 1.1.2',
                                title: 'node 1.1.2'
                            }
                        },
                    ]
                },
                {
                    metadata: {
                        name: 'node 1.2',
                        title: 'node 1.2'
                    }
                },
            ]
        }
    }
    
    
    const features = wmsToOWSResources(capabilities)

    expect(features).toBeDefined()
    expect(features.length).equals(5)
})

test('treeify success', () => {
    const tree = treeify(getOwsContext().features)

    expect(tree.length).equals(2)
    expect(tree[0].children.length).equals(3)
    expect(tree[0].children[0].children.length).equals(0)
    expect(tree[0].children[1].children.length).equals(1)
    expect(tree[0].children[1].children[0].children.length).equals(0)
    expect(tree[0].children[2].children.length).equals(0)
})

test('treeify wrong feature order', () => {
    const context = getOwsContext()
    context.features.splice(2, 1)   
    
    expect(()=>treeify(context.features)).toThrowError('parsingerror... the context is not well ordered.')    
})

test('isDescandantOf', () => {
    const context = getOwsContext()
    expect(isDescendantOf(context.features[3], context.features[0])).toBeTruthy()
    expect(isDescendantOf(context.features[1], context.features[0])).toBeTruthy()

    expect(isDescendantOf(context.features[3], context.features[3])).toBeFalsy()
    expect(isDescendantOf(context.features[4], context.features[3])).toBeFalsy()
    expect(isDescendantOf(context.features[3], context.features[4])).toBeFalsy()
    expect(isDescendantOf(context.features[0], context.features[4])).toBeFalsy()
    expect(isDescendantOf(context.features[2],context.features[4])).toBeFalsy()
})

test('isAncestorOf', () => {
    const context = getOwsContext()
    expect(isAncestorOf(context.features[0], context.features[3])).toBeTruthy()
    expect(isAncestorOf(context.features[2], context.features[3])).toBeTruthy()

    expect(isAncestorOf(context.features[4], context.features[3])).toBeFalsy()
    expect(isAncestorOf(context.features[3], context.features[0])).toBeFalsy()
    expect(isAncestorOf(context.features[0], context.features[0])).toBeFalsy()
})

test('isChildOf', () => {
    const context = getOwsContext()

    expect(isChildOf(context.features[1], context.features[0])).toBeTruthy()

    expect(isChildOf(context.features[0], context.features[1])).toBeFalsy()
    expect(isChildOf(context.features[3], context.features[0])).toBeFalsy()
})

test('getParentFolder', () => {
    const context = getOwsContext()

    expect(getParentFolder(context.features[0])).toBeUndefined()
    expect(getParentFolder(context.features[1])).equals('/0')
    expect(getParentFolder(context.features[3])).equals('/0/1')
})

test('getParent', () => {
    const context = getOwsContext()

    expect(getParent(context.features, context.features[3])).equals(context.features[2])

    expect(getParent(context.features, context.features[0])).toBeUndefined()
})

test('isParentOf', () => {
    const context = getOwsContext()

    expect(isParentOf(context.features[0], context.features[1])).toBeTruthy()
    expect(isParentOf(context.features[2], context.features[3])).toBeTruthy()

    expect(isParentOf(context.features[1], context.features[0])).toBeFalsy()
    expect(isParentOf(context.features[3], context.features[0])).toBeFalsy()
})

test('isSiblingOf', () => {
    const context = getOwsContext()

    expect(isSiblingOf(context.features[1], context.features[2])).toBeTruthy()
    expect(isSiblingOf(context.features[2], context.features[4])).toBeTruthy()
    expect(isSiblingOf(context.features[0], context.features[5])).toBeTruthy() // tree 0 is sibling of tree 1

    expect(isSiblingOf(context.features[0], context.features[0])).toBeFalsy()
    expect(isSiblingOf(context.features[0], context.features[3])).toBeFalsy()
})


test('getSiblings', () => {
    const context = getOwsContext()

    expect(getSiblings(context.features, context.features[1])).toMatchObject([context.features[2], context.features[4]])
    expect(getSiblings(context.features, context.features[1], true)).toMatchObject([context.features[1], context.features[2], context.features[4]])

    expect(getSiblings(context.features, context.features[2], true, true)).toMatchObject([context.features[1], context.features[2], context.features[3], context.features[4]])    
    expect(getSiblings(context.features, context.features[2], false, true)).toMatchObject([context.features[1], context.features[4]])

})

test('getRightSiblings of wald 0', () => {
    const karteRpFeatures = getKarteRpFeatures()
    expect(getRightSiblings(karteRpFeatures, karteRpFeatures[7], false, true)).toMatchObject([karteRpFeatures[8],karteRpFeatures[9],karteRpFeatures[10],karteRpFeatures[11]])
    expect(getRightSiblings(karteRpFeatures, karteRpFeatures[7], true, true)).toMatchObject([karteRpFeatures[7],karteRpFeatures[8],karteRpFeatures[9],karteRpFeatures[10],karteRpFeatures[11]])
})

test('getRightSiblings of wald 2', () => {
    const karteRpFeatures = getKarteRpFeatures()
    expect(getRightSiblings(karteRpFeatures, karteRpFeatures[9], false, true)).toMatchObject([karteRpFeatures[10],karteRpFeatures[11]])
    expect(getRightSiblings(karteRpFeatures, karteRpFeatures[9], true, true)).toMatchObject([karteRpFeatures[9],karteRpFeatures[10],karteRpFeatures[11]])
})

test('getDescendants', () => {
    const context = getOwsContext()

    expect(getDescandants(context.features, context.features[2])).toMatchObject([context.features[3]])
    expect(getDescandants(context.features, context.features[2], true)).toMatchObject([context.features[2], context.features[3]])
    expect(getDescandants(context.features, context.features[3])).toMatchObject([])
    expect(getDescandants(context.features, context.features[3], true)).toMatchObject([context.features[3]])
})

test('getFirstChildIndex', () => {
    const context = getOwsContext()

    expect(getFirstChildIndex(context, context.features[0])).equals(1)
    expect(getFirstChildIndex(context, context.features[2])).equals(3)
})

test('getLastChildIndex', () => {
    const context = getOwsContext()

    expect(getLastChildIndex(context.features, context.features[0])).equals(2)
    expect(getLastChildIndex(context.features, context.features[2])).equals(0)
    expect(getLastChildIndex(context.features, context.features[3])).equals(-1)
})

test('sortByFolder', () => {
    const context = getOwsContext()
    const featuresCopy = JSON.parse(JSON.stringify(context.features))

    context.features = context.features.reverse()

    const feature1 = context.features[1]
    const feature3 = context.features[3]

    context.features[1] = feature3
    context.features[3] = feature1

    expect(sortFeaturesByFolder(context.features)).toMatchObject(featuresCopy)
})

test('moveFeature lastChild', () => {
    const context = getOwsContext()
    const features = moveFeature(context.features, context.features[2], context.features[1])
    // TODO: checking titles also 
    expect(features?.[2].properties.folder).equals('/0/0/0')
    expect(features?.[3].properties.folder, 'subnode of source tree is not up to date').equals('/0/0/0/0')
    expect(features?.[4].properties.folder, 'sibling folders are not up to date').equals('/0/1')
})

test('moveFeature firstChild', () => {
    const context = getOwsContext()
    const features = moveFeature(context.features, context.features[2], context.features[0], Position.firstChild)

    // TODO: checking titles also 
    expect(features?.[1].properties.folder).equals('/0/0')
    expect(features?.[2].properties.folder).equals('/0/0/0')
    expect(features?.[3].properties.folder).equals('/0/1')
    expect(features?.[4].properties.folder).equals('/0/2')
})


test('moveFeature left', () => {
    const context = getOwsContext()
    const features = moveFeature(context.features, context.features[2], context.features[0], Position.left)
    
    
    expect(features?.[0].properties.folder).equals('/0')
    expect(features?.[0].properties.title).equals('/0/1')

    expect(features?.[1].properties.folder).equals('/0/0')
    expect(features?.[1].properties.title).equals('/0/1/0')

    expect(features?.[2].properties.folder).equals('/1')
    expect(features?.[2].properties.title).equals('/0')

    expect(features?.[3].properties.folder).equals('/1/0')
    expect(features?.[3].properties.title).equals('/0/0')

    expect(features?.[4].properties.folder).equals('/1/1')
    expect(features?.[4].properties.title).equals('/0/2')
})

test('moveFeature right', () => {
    const context = getOwsContext()
    const features = moveFeature(context.features, context.features[2], context.features[0], Position.right)
    
    expect(features?.[0].properties.folder).equals('/0')
    expect(features?.[0].properties.title).equals('/0')

    expect(features?.[1].properties.folder).equals('/0/0')
    expect(features?.[1].properties.title).equals('/0/0')

    expect(features?.[2].properties.folder).equals('/0/1')
    expect(features?.[2].properties.title).equals('/0/2')

    expect(features?.[3].properties.folder).equals('/1')
    expect(features?.[3].properties.title).equals('/0/1')

    expect(features?.[4].properties.folder).equals('/1/0')
    expect(features?.[4].properties.title).equals('/0/1/0')
})


test('moveFeature wald3 as left sibling of wald0', () => {

    const karteRpFeatures = getKarteRpFeatures()

    const features = moveFeature(karteRpFeatures, karteRpFeatures[10], karteRpFeatures[7], Position.left)

    expect(features?.[7].properties.title).equals('Wald 3')
    expect(features?.[7].properties.folder).equals('/0/1/0')

    expect(features?.[8].properties.title).equals('Wald 0')
    expect(features?.[8].properties.folder).equals('/0/1/1')

})

test('moveFeature wald3 as right sibling of wald0', () => {
    const karteRpFeatures = getKarteRpFeatures()

    // Wald 3 right of Wald 0
    const features = moveFeature(karteRpFeatures, karteRpFeatures[10], karteRpFeatures[7], Position.right)
    expect(features?.[7].properties.title).equals('Wald 0')
    expect(features?.[7].properties.folder).equals('/0/1/0')

    expect(features?.[8].properties.title).equals('Wald 3')
    expect(features?.[8].properties.folder).equals('/0/1/1')

    expect(features?.[9].properties.title).equals('Wald 1')
    expect(features?.[9].properties.folder).equals('/0/1/2')

    expect(features?.[10].properties.title).equals('Wald 2')
    expect(features?.[10].properties.folder).equals('/0/1/3')

    expect(features?.[11].properties.title).equals('Wald 4')
    expect(features?.[11].properties.folder).equals('/0/1/4')

})


test('moveFeature wald3 as right sibling of wald2', () => {
    const karteRpFeatures = getKarteRpFeatures()

    // Wald 3 right of Wald 2
    const features = moveFeature(karteRpFeatures, karteRpFeatures[10], karteRpFeatures[9], Position.right)
    expect(features?.[7].properties.title).equals('Wald 0')
    expect(features?.[7].properties.folder).equals('/0/1/0')

    expect(features?.[8].properties.title).equals('Wald 1')
    expect(features?.[8].properties.folder).equals('/0/1/1')

    expect(features?.[9].properties.title).equals('Wald 2')
    expect(features?.[9].properties.folder).equals('/0/1/2')

    expect(features?.[10].properties.title).equals('Wald 3')
    expect(features?.[10].properties.folder).equals('/0/1/3')

    expect(features?.[11].properties.title).equals('Wald 4')
    expect(features?.[11].properties.folder).equals('/0/1/4')
})


test('moveFeature wald3 as first child of wald2', () => {
    const karteRpFeatures = getKarteRpFeatures()

    // Wald 3 as first child of Wald 2
    const features = moveFeature(karteRpFeatures, karteRpFeatures[10], karteRpFeatures[9], Position.firstChild)
    expect(features?.[7].properties.title).equals('Wald 0')
    expect(features?.[7].properties.folder).equals('/0/1/0')

    expect(features?.[8].properties.title).equals('Wald 1')
    expect(features?.[8].properties.folder).equals('/0/1/1')

    expect(features?.[9].properties.title).equals('Wald 2')
    expect(features?.[9].properties.folder).equals('/0/1/2')

    expect(features?.[10].properties.title).equals('Wald 3')
    expect(features?.[10].properties.folder).equals('/0/1/2/0')

    expect(features?.[11].properties.title).equals('Wald 4')
    expect(features?.[11].properties.folder).equals('/0/1/3')
})

test('moveFeature wald3 as left sibling of wald', () => {
    const karteRpFeatures = getKarteRpFeatures()

    // Wald 3 left of Wald
    const features = moveFeature(karteRpFeatures, karteRpFeatures[10], karteRpFeatures[6], Position.left)
    
    expect(features?.[6].properties.title).equals('Wald 3')
    expect(features?.[6].properties.folder).equals('/0/1')

    expect(features?.[7].properties.title).equals('Wald')
    expect(features?.[7].properties.folder).equals('/0/2')

    expect(features?.[8].properties.title).equals('Wald 0')
    expect(features?.[8].properties.folder).equals('/0/2/0')

    expect(features?.[9].properties.title).equals('Wald 1')
    expect(features?.[9].properties.folder).equals('/0/2/1')

    expect(features?.[10].properties.title).equals('Wald 2')
    expect(features?.[10].properties.folder).equals('/0/2/2')

    expect(features?.[11].properties.title).equals('Wald 4')
    expect(features?.[11].properties.folder).equals('/0/2/3')
})


test('isLeafNode', () => {
    const context = getOwsContext()

    expect(isLeafNode(context.features, context.features[0])).toBeFalsy()
    expect(isLeafNode(context.features, context.features[1])).toBeTruthy()
    expect(isLeafNode(context.features, context.features[2])).toBeFalsy()
    expect(isLeafNode(context.features, context.features[3])).toBeTruthy()
    expect(isLeafNode(context.features, context.features[4])).toBeTruthy()
})



test('validateFolderStructure', () => {
    const kartRp = getKarteRpFeatures()
    
    expect(validateFolderStructure(kartRp)).toBeTruthy()
})


test('updateFoders without start index', () => {
    const resources: OWSResource[] = [
        getOwsResource('/1', '/1'),
        getOwsResource('/1/2', '/1/2'),
        getOwsResource('/1/2/0', '/1/2/0'),
        getOwsResource('/1/2/3', '/1/2/3'),
    ]

    const expected: OWSResource[] = [
        getOwsResource('/1', '/0/0/0'),
        getOwsResource('/1/2', '/0/0/0/0'),
        getOwsResource('/1/2/0', '/0/0/0/0/0'),
        getOwsResource('/1/2/3', '/0/0/0/0/1'),

    ]

    updateFolders(resources, '/0/0', )

    expect(resources).toMatchObject(expected)
})


test('updateFoders with start index', () => {
    const resources: OWSResource[] = [
        getOwsResource('/1', '/1'),
        getOwsResource('/1/2', '/1/2'),
        getOwsResource('/1/2/0', '/1/2/0'),
        getOwsResource('/1/2/3', '/1/2/3'),
    ]

    const expected: OWSResource[] = [
        getOwsResource('/1', '/0/0/2'),
        getOwsResource('/1/2', '/0/0/2/0'),
        getOwsResource('/1/2/0', '/0/0/2/0/0'),
        getOwsResource('/1/2/3', '/0/0/2/0/1'),
    ]

    updateFolders(resources, '/0/0', 2)

    expect(resources).toMatchObject(expected)
})

test('updateFoders without new path without start index', () => {
    const resources: OWSResource[] = [
        getOwsResource('/1', '/1'),
        getOwsResource('/1/2', '/1/2'),
        getOwsResource('/1/2/0', '/1/2/0'),
        getOwsResource('/1/2/3', '/1/2/3'),

    ]

    const expected: OWSResource[] = [
        getOwsResource('/1', '/0'),
        getOwsResource('/1/2', '/0/0'),
        getOwsResource('/1/2/0', '/0/0/0'),
        getOwsResource('/1/2/3', '/0/0/1'),

    ]

    updateFolders(resources, '', )

    expect(resources).toMatchObject(expected)
})

test('updateFoders with new path without start index', () => {
    const resources: OWSResource[] = [
        getOwsResource('/1', '/1'),
        getOwsResource('/1/2', '/1/2'),
        getOwsResource('/1/2/0', '/1/2/0'),
        getOwsResource('/1/2/3', '/1/2/3'),
        getOwsResource('/1/3', '/1/4'),
    ]

    const expected: OWSResource[] = [
        getOwsResource('/1', '/2/4/0'),
        getOwsResource('/1/2', '/2/4/0/0'),
        getOwsResource('/1/2/0', '/2/4/0/0/0'),
        getOwsResource('/1/2/3', '/2/4/0/0/1'),
        getOwsResource('/1/3', '/2/4/0/1'),
    ]

    updateFolders(resources, '/2/4', )

    expect(resources).toMatchObject(expected)
})

