import { expect, test } from 'vitest'
import { WmsCapabilitites } from '../../XMLParser/types'
import { getDescandants, getFirstChildIndex, getLastChildIndex, getParent, getParentFolder, getSiblings, isAncestorOf, isChildOf, isDescendantOf, isParentOf, isSiblingOf, moveFeature, sortFeaturesByFolder, treeify, wmsToOWSResources } from '../utils'
import { OWSContext, OWSResource } from '../types'
import { Position } from '../enums'


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
                    title: 'node1',
                    updated: new Date().toISOString(),
                    folder: '/0'
                }
            },
            // 1
            {
                type: 'Feature',
                properties: {
                    title: 'node1.1',
                    updated: new Date().toISOString(),
                    folder: '/0/0'
                }
            },
            // 2
            {
                type: 'Feature',
                properties: {
                    title: 'node1.2',
                    updated: new Date().toISOString(),
                    folder: '/0/1'
                }
            },
            // 3
            {
                type: 'Feature',
                properties: {
                    title: 'node1.2.1',
                    updated: new Date().toISOString(),
                    folder: '/0/1/0'
                }
            },
            // 4
            {
                type: 'Feature',
                properties: {
                    title: 'node1.3',

                    updated: new Date().toISOString(),
                    folder: '/0/2'
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

    expect(tree.length).equals(1)
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

    expect(getParent(context, context.features[3])).equals(context.features[2])

    expect(getParent(context, context.features[0])).toBeUndefined()
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

    expect(getLastChildIndex(context, context.features[0])).equals(4)
})


test('sortByFolder', () => {
    const context = getOwsContext()
    context.features = context.features.reverse()

    const feature1 = context.features[1]
    const feature3 = context.features[3]

    context.features[1] = feature3
    context.features[3] = feature1

    expect(sortFeaturesByFolder(context)).toMatchObject(getOwsContext())
})

test('moveFeature lastChild', () => {
    const context = getOwsContext()
    const newContext = moveFeature(context, context.features[2], context.features[1])

    expect(newContext?.features[2].properties.folder).equals('/0/0/0')
    expect(newContext?.features[3].properties.folder, 'subnode of source tree is not up to date').equals('/0/0/0/0')
    expect(newContext?.features[4].properties.folder, 'sibling folders are not up to date').equals('/0/1')
})

test('moveFeature firstChild', () => {
    const context = getOwsContext()
    const newContext = moveFeature(context, context.features[2], context.features[0], Position.firstChild)

    expect(newContext?.features[1].properties.folder).equals('/0/0')
    expect(newContext?.features[2].properties.folder).equals('/0/0/0')
    expect(newContext?.features[3].properties.folder).equals('/0/1')
    expect(newContext?.features[4].properties.folder).equals('/0/2')
})