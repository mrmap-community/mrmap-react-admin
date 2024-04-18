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


test('treeify', () => {

    const owsContext: OWSContext = {
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

    const tree = treeify(owsContext)

    expect(tree.length).equals(1)


})