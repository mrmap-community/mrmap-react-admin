import { expect, test } from 'vitest'
import { WmsCapabilitites } from '../../XMLParser/types'
import { wmsToOWSContext } from '../utils'

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
