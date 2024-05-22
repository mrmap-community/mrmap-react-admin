import { expect, test } from 'vitest'

import { WmsCapabilitites } from '../../XMLParser/types'
import { OWSContext, OWSResource } from '../core'
import { Position } from '../enums'
import { OWSResource as IOWSResource } from '../types'
//import { OWSResource } from '../types'
import { treeify, updateFolders, wmsToOWSResources } from '../utils'
import { karteRpFeatures as testdata } from './data'

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
    const owsContext = new OWSContext()
    const features = [
            // 0
            new OWSResource(
                owsContext, 
                {
                    title: '/0',
                    updated: new Date().toISOString(),
                    folder: '/0'
                }
            ),
            // 1
            new OWSResource(
                owsContext,
                {
                    title: '/0/0',
                    updated: new Date().toISOString(),
                    folder: '/0/0'
                }
            ),
            // 2
            new OWSResource(
                owsContext,
                {
                    title: '/0/1',
                    updated: new Date().toISOString(),
                    folder: '/0/1'
                }
            ),
            // 3
            new OWSResource(
                owsContext,
                {
                    title: '/0/1/0',
                    updated: new Date().toISOString(),
                    folder: '/0/1/0'
                }
            ),
            // 4
            new OWSResource(
                owsContext,
                {
                    title: '/0/2',

                    updated: new Date().toISOString(),
                    folder: '/0/2'
                }
            ),
            // 5
            new OWSResource(
                owsContext,
                {
                    title: '/1',

                    updated: new Date().toISOString(),
                    folder: '/1'
                }
            )
        ]

    owsContext.features = features
    return owsContext
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
    expect(context.features[3].isDescendantOf(context.features[0])).toBeTruthy()
    expect(context.features[1].isDescendantOf(context.features[0])).toBeTruthy()

    expect(context.features[3].isDescendantOf(context.features[3])).toBeFalsy()
    expect(context.features[4].isDescendantOf(context.features[3])).toBeFalsy()
    expect(context.features[3].isDescendantOf(context.features[4])).toBeFalsy()
    expect(context.features[0].isDescendantOf(context.features[4])).toBeFalsy()
    expect(context.features[2].isDescendantOf(context.features[4])).toBeFalsy()
})

test('isAncestorOf', () => {
    const context = getOwsContext()
    expect(context.features[0].isAncestorOf(context.features[3])).toBeTruthy()
    expect(context.features[2].isAncestorOf(context.features[3])).toBeTruthy()

    expect(context.features[4].isAncestorOf(context.features[3])).toBeFalsy()
    expect(context.features[3].isAncestorOf(context.features[0])).toBeFalsy()
    expect(context.features[0].isAncestorOf(context.features[0])).toBeFalsy()
})

test('isChildOf', () => {
    const context = getOwsContext()

    expect(context.features[1].isChildOf(context.features[0])).toBeTruthy()

    expect(context.features[0].isChildOf(context.features[1])).toBeFalsy()
    expect(context.features[3].isChildOf(context.features[0])).toBeFalsy()
})

test('getParentFolder', () => {
    const context = getOwsContext()

    expect(context.features[0].getParentFolder()).toBeUndefined()
    expect(context.features[1].getParentFolder()).equals('/0')
    expect(context.features[3].getParentFolder()).equals('/0/1')
})

test('getParent', () => {
    const context = getOwsContext()

    expect(context.features[3].getParent()).equals(context.features[2])
    expect(context.features[0].getParent()).toBeUndefined()
})

test('isParentOf', () => {
    const context = getOwsContext()

    expect(context.features[0].isParentOf(context.features[1])).toBeTruthy()
    expect(context.features[2].isParentOf(context.features[3])).toBeTruthy()

    expect(context.features[1].isParentOf(context.features[0])).toBeFalsy()
    expect(context.features[3].isParentOf(context.features[0])).toBeFalsy()
})

test('isSiblingOf', () => {
    const context = getOwsContext()

    expect(context.features[1].isSiblingOf(context.features[2])).toBeTruthy()
    expect(context.features[2].isSiblingOf(context.features[4])).toBeTruthy()
    expect(context.features[0].isSiblingOf(context.features[5])).toBeTruthy() // tree 0 is sibling of tree 1

    expect(context.features[0].isSiblingOf(context.features[0])).toBeFalsy()
    expect(context.features[0].isSiblingOf(context.features[3])).toBeFalsy()
})

test('getSiblings', () => {
    const context = getOwsContext()

    expect(context.features[1].getSiblings()).toMatchObject([context.features[2], context.features[4]])
    expect(context.features[1].getSiblings(true)).toMatchObject([context.features[1], context.features[2], context.features[4]])

    expect(context.features[2].getSiblings(true, true)).toMatchObject([context.features[1], context.features[2], context.features[3], context.features[4]])    
    expect(context.features[2].getSiblings(false, true)).toMatchObject([context.features[1], context.features[4]])
})

test('getRightSiblings of /0/0', () => {
    const context = getOwsContext()

    const features = context.features

    expect(features[1].getRightSiblings(false, true)).toMatchObject([features[2], features[3], features[4]])
    expect(features[1].getRightSiblings(true, true)).toMatchObject([features[1], features[2], features[3], features[4]])
})

test('getRightSiblings of wald 0', () => {
    const karteRpFeatures = getKarteRpFeatures()
    expect(karteRpFeatures[7].getRightSiblings(false, true)).toMatchObject([karteRpFeatures[8],karteRpFeatures[9],karteRpFeatures[10],karteRpFeatures[11]])
    expect(karteRpFeatures[7].getRightSiblings(true, true)).toMatchObject([karteRpFeatures[7],karteRpFeatures[8],karteRpFeatures[9],karteRpFeatures[10],karteRpFeatures[11]])
})

test('getRightSiblings of wald 2', () => {
    const karteRpFeatures = getKarteRpFeatures()
    expect(karteRpFeatures[9].getRightSiblings(false, true)).toMatchObject([karteRpFeatures[10],karteRpFeatures[11]])
    expect(karteRpFeatures[9].getRightSiblings(true, true)).toMatchObject([karteRpFeatures[9],karteRpFeatures[10],karteRpFeatures[11]])
})

test('getDescendants', () => {
    const context = getOwsContext()

    expect(context.features[2].getDescandants()).toMatchObject([context.features[3]])
    expect(context.features[2].getDescandants(true)).toMatchObject([context.features[2], context.features[3]])
    expect(context.features[3].getDescandants()).toMatchObject([])
    expect(context.features[3].getDescandants(true)).toMatchObject([context.features[3]])
})

test('getFirstChildIndex', () => {
    const context = getOwsContext()

    expect(context.features[0].getFirstChildIndex()).equals(1)
    expect(context.features[2].getFirstChildIndex()).equals(3)
})

test('getLastChildIndex', () => {
    const context = getOwsContext()

    expect(context.features[0].getLastChildIndex()).equals(2)
    expect(context.features[2].getLastChildIndex()).equals(0)
    expect(context.features[3].getLastChildIndex()).equals(-1)
})

test('sortByFolder', () => {
    const context = getOwsContext()
    const featuresCopy = JSON.parse(JSON.stringify(context.features))

    context.features = context.features.toReversed()

    const feature1 = context.features[1]
    const feature3 = context.features[3]

    context.features[1] = feature3
    context.features[3] = feature1

    expect(context.sortFeaturesByFolder()).toMatchObject(featuresCopy)
})

test('moveFeature lastChild', () => {
    const context = getOwsContext()
    const features = context.features[2].moveFeature(context.features[1])
    // TODO: checking titles also 
    expect(features?.[2].properties.folder).equals('/0/0/0')
    expect(features?.[3].properties.folder, 'subnode of source tree is not up to date').equals('/0/0/0/0')
    expect(features?.[4].properties.folder, 'sibling folders are not up to date').equals('/0/1')
})

test('moveFeature firstChild', () => {
    const context = getOwsContext()
    const features = context.features[2].moveFeature(context.features[0], Position.firstChild)

    expect(features?.[1].properties.folder).equals('/0/0')
    expect(features?.[1].properties.title).equals('/0/1')

    expect(features?.[2].properties.folder).equals('/0/0/0')
    expect(features?.[2].properties.title).equals('/0/1/0')

    expect(features?.[3].properties.folder).equals('/0/1')
    expect(features?.[3].properties.title).equals('/0/0')

    expect(features?.[4].properties.folder).equals('/0/2')
    expect(features?.[4].properties.title).equals('/0/2')

    expect(features?.[5].properties.folder).equals('/1')
    expect(features?.[5].properties.title).equals('/1')
})


test('moveFeature left', () => {
    const context = getOwsContext()
    const features = context.features[2].moveFeature(context.features[0], Position.left)
    
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
    const features = context.features[2].moveFeature(context.features[0], Position.right)
    
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

    const features = karteRpFeatures[10].moveFeature(karteRpFeatures[7], Position.left)

    expect(features?.[7].properties.title).equals('Wald 3')
    expect(features?.[7].properties.folder).equals('/0/1/0')

    expect(features?.[8].properties.title).equals('Wald 0')
    expect(features?.[8].properties.folder).equals('/0/1/1')

})

test('moveFeature wald3 as right sibling of wald0', () => {
    const karteRpFeatures = getKarteRpFeatures()

    // Wald 3 right of Wald 0
    const features = karteRpFeatures[10].moveFeature(karteRpFeatures[7], Position.right)
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
    const features = karteRpFeatures[10].moveFeature(karteRpFeatures[9], Position.right)
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
    const features = karteRpFeatures[10].moveFeature(karteRpFeatures[9], Position.firstChild)

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
    const features = karteRpFeatures[10].moveFeature(karteRpFeatures[6], Position.left)
    
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


test('moveFeature sequence', () => {
    const karteRpFeatures = getKarteRpFeatures()

    // Wald 3 left of Wald
    const features = karteRpFeatures[10].moveFeature(karteRpFeatures[6], Position.left)
    
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

    // Wald 2 left of Wald 3
    features[10].moveFeature(features[6], Position.left)

    expect(features?.[6].properties.title).equals('Wald 2')
    expect(features?.[6].properties.folder).equals('/0/1')

    expect(features?.[7].properties.title).equals('Wald 3')
    expect(features?.[7].properties.folder).equals('/0/2')

    expect(features?.[8].properties.title).equals('Wald')
    expect(features?.[8].properties.folder).equals('/0/3')

    expect(features?.[9].properties.title).equals('Wald 0')
    expect(features?.[9].properties.folder).equals('/0/3/0')

    expect(features?.[10].properties.title).equals('Wald 1')
    expect(features?.[10].properties.folder).equals('/0/3/1')

    expect(features?.[11].properties.title).equals('Wald 4')
    expect(features?.[11].properties.folder).equals('/0/3/2')


})


test('isLeafNode', () => {
    const context = getOwsContext()

    expect(context.features[0].isLeafNode()).toBeFalsy()
    expect(context.features[1].isLeafNode()).toBeTruthy()
    expect(context.features[2].isLeafNode()).toBeFalsy()
    expect(context.features[3].isLeafNode()).toBeTruthy()
    expect(context.features[4].isLeafNode()).toBeTruthy()
})

test('validateFolderStructure', () => {
    const kartRp = getKarteRpFeatures()
    
    expect(kartRp.validateFolderStructure()).toBeTruthy()
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


test('remove feature', () => {
    const karteRpFeatures = getKarteRpFeatures()
    // remove wald
    karteRpFeatures[6].remove()

    expect(karteRpFeatures[5].properties.title).equals('Land 3')
    expect(karteRpFeatures[5].properties.folder).equals('/0/0/3')

    expect(karteRpFeatures[6].properties.title).equals('Sonderkultur')
    expect(karteRpFeatures[6].properties.folder).equals('/0/1')

    expect(karteRpFeatures[7].properties.title).equals('Sonderkultur 0')
    expect(karteRpFeatures[7].properties.folder).equals('/0/1/0')

})


test('insert feature as first child of Wald', () => {
    const karteRpFeatures = getKarteRpFeatures()

    const newFeature: IOWSResource = 
    {
        type: 'Feature',
        properties: {
            title: 'new node',
            updated: new Date().toString()
        }

    }
    karteRpFeatures.insertFeature(karteRpFeatures[6], newFeature, Position.firstChild)

    expect(karteRpFeatures[6].properties.title).equals('Wald')
    expect(karteRpFeatures[6].properties.folder).equals('/0/1')

    expect(karteRpFeatures[7].properties.title).equals('new node')
    expect(karteRpFeatures[7].properties.folder).equals('/0/1/0')

    expect(karteRpFeatures[8].properties.title).equals('Wald 0')
    expect(karteRpFeatures[8].properties.folder).equals('/0/1/1')
})

test('insert feature as last child of Wald', () => {
    const karteRpFeatures = getKarteRpFeatures()

    const newFeature: IOWSResource = 
    {
        type: 'Feature',
        properties: {
            title: 'new node',
            updated: new Date().toString()
        }

    }
    
    karteRpFeatures.insertFeature(karteRpFeatures[6], newFeature, Position.lastChild)

    expect(karteRpFeatures[6].properties.title).equals('Wald')
    expect(karteRpFeatures[6].properties.folder).equals('/0/1')

    expect(karteRpFeatures[7].properties.title).equals('Wald 0')
    expect(karteRpFeatures[7].properties.folder).equals('/0/1/0')

    expect(karteRpFeatures[8].properties.title).equals('Wald 1')
    expect(karteRpFeatures[8].properties.folder).equals('/0/1/1')

    expect(karteRpFeatures[9].properties.title).equals('Wald 2')
    expect(karteRpFeatures[9].properties.folder).equals('/0/1/2')

    expect(karteRpFeatures[10].properties.title).equals('Wald 3')
    expect(karteRpFeatures[10].properties.folder).equals('/0/1/3')

    expect(karteRpFeatures[11].properties.title).equals('Wald 4')
    expect(karteRpFeatures[11].properties.folder).equals('/0/1/4')

    expect(karteRpFeatures[12].properties.title).equals('new node')
    expect(karteRpFeatures[12].properties.folder).equals('/0/1/5')
})


test('insert feature left of Wald', () => {
    const karteRpFeatures = getKarteRpFeatures()

    const newFeature: IOWSResource = 
    {
        type: 'Feature',
        properties: {
            title: 'new node',
            updated: new Date().toString()
        }

    }
    karteRpFeatures.insertFeature(karteRpFeatures[6], newFeature, Position.left)

    expect(karteRpFeatures[6].properties.title).equals('new node')
    expect(karteRpFeatures[6].properties.folder).equals('/0/1')

    expect(karteRpFeatures[7].properties.title).equals('Wald')
    expect(karteRpFeatures[7].properties.folder).equals('/0/2')

    expect(karteRpFeatures[8].properties.title).equals('Wald 0')
    expect(karteRpFeatures[8].properties.folder).equals('/0/2/0')

    expect(karteRpFeatures[9].properties.title).equals('Wald 1')
    expect(karteRpFeatures[9].properties.folder).equals('/0/2/1')

    expect(karteRpFeatures[10].properties.title).equals('Wald 2')
    expect(karteRpFeatures[10].properties.folder).equals('/0/2/2')

    expect(karteRpFeatures[11].properties.title).equals('Wald 3')
    expect(karteRpFeatures[11].properties.folder).equals('/0/2/3')

    expect(karteRpFeatures[12].properties.title).equals('Wald 4')
    expect(karteRpFeatures[12].properties.folder).equals('/0/2/4')


})

test('insert feature right of Wald', () => {
    const karteRpFeatures = getKarteRpFeatures()

    const newFeature: IOWSResource = 
    {
        type: 'Feature',
        properties: {
            title: 'new node',
            updated: new Date().toString()
        }

    }
    karteRpFeatures.insertFeature(karteRpFeatures[6], newFeature, Position.right)

    expect(karteRpFeatures[6].properties.title).equals('Wald')
    expect(karteRpFeatures[6].properties.folder).equals('/0/1')

    expect(karteRpFeatures[7].properties.title).equals('Wald 0')
    expect(karteRpFeatures[7].properties.folder).equals('/0/1/0')

    expect(karteRpFeatures[8].properties.title).equals('Wald 1')
    expect(karteRpFeatures[8].properties.folder).equals('/0/1/1')

    expect(karteRpFeatures[9].properties.title).equals('Wald 2')
    expect(karteRpFeatures[9].properties.folder).equals('/0/1/2')

    expect(karteRpFeatures[10].properties.title).equals('Wald 3')
    expect(karteRpFeatures[10].properties.folder).equals('/0/1/3')

    expect(karteRpFeatures[11].properties.title).equals('Wald 4')
    expect(karteRpFeatures[11].properties.folder).equals('/0/1/4')

    expect(karteRpFeatures[12].properties.title).equals('new node')
    expect(karteRpFeatures[12].properties.folder).equals('/0/2')

    expect(karteRpFeatures[13].properties.title).equals('Sonderkultur')
    expect(karteRpFeatures[13].properties.folder).equals('/0/3')

})