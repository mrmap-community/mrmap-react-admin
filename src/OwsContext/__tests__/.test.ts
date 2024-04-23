import { expect, test } from 'vitest'
import { WmsCapabilitites } from '../../XMLParser/types'
import { isDescendantOf, treeify, wmsToOWSResources } from '../utils'
import { OWSContext } from '../types'


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


test('treeify success', () => {
    const tree = treeify(getOwsContext())

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
    
    expect(()=>treeify(context)).toThrowError('parsingerror... the context is not well ordered.')

    
})

test('isDescandantOf', () => {
    const context = getOwsContext()
    // some descendant
    expect(isDescendantOf(context.features[0], context.features[3])).toBeTruthy()
    // some uncle
    expect(isDescendantOf(context.features[3], context.features[4])).toBeFalsy()
    // some nephew
    expect(isDescendantOf(context.features[4], context.features[3])).toBeFalsy()
    
    expect(isDescendantOf(context.features[4], context.features[0])).toBeFalsy()
    // siblings
    expect(isDescendantOf(context.features[4], context.features[2])).toBeFalsy()

})