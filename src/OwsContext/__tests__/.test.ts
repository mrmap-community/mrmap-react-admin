import { expect, test } from 'vitest'
import { WmsCapabilitites } from '../../XMLParser/types'
import { treeify, wmsToOWSContext } from '../utils'
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
    
    
    const contextDoc = wmsToOWSContext(capabilities)

    expect(contextDoc).toBeDefined()
    expect(contextDoc.features.length).equals(5)
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
            {
                type: 'Feature',
                title: 'node0',
                properties: {
                    updated: new Date().toISOString(),
                    folder: '/node0'
                }
            },
            {
                type: 'Feature',
                title: 'node1.1',
                properties: {
                    updated: new Date().toISOString(),
                    folder: '/node0/node11'
                }
            },
            {
                type: 'Feature',
                title: 'node1.2',
                properties: {
                    updated: new Date().toISOString(),
                    folder: '/node0/node12'
                }
            },
            {
                type: 'Feature',
                title: 'node1.2.1',
                properties: {
                    updated: new Date().toISOString(),
                    folder: '/node0/node12/node121'
                }
            },
            {
                type: 'Feature',
                title: 'node1.3',
                properties: {
                    updated: new Date().toISOString(),
                    folder: '/node0/node13'
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