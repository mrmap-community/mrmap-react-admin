import { OWSResource } from '../types'


export const karteRpFeatures: OWSResource[] = [
    {
      "type": "Feature",
      "properties": {
        "title": "Karte RP",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=atkis1",
                "method": "GET",
                "type": "image/png"
              }
            ]
          }
        ],
        "folder": "/0"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Landesfläche",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=Landesflaeche",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=Landesflaeche&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/0"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Land 0",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=rlp_00",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=rlp_00&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/0/1"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Land 1",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=rlp_01",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=rlp_01&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/0/2"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Land 2",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=rlp_02",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=rlp_02&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/0/3"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Land 3",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=rlp_03",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=rlp_03&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/0/4"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Wald",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=Wald",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=Wald&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/1"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Wald 0",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=wald_00",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=wald_00&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/1/0"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Wald 1",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=wald_01",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=wald_01&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/1/1"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Wald 2",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=wald_02",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=wald_02&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/1/2"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Wald 3",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=wald_03",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=wald_03&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/1/3"
      }
    },
    {
      "type": "Feature",
      "properties": {
        "title": "Wald 4",
        "updated": "2024-05-02T12:19:32.549Z",
        "offerings": [
          {
            "code": "http://www.opengis.net/spec/owc/1.0/req/wms",
            "operations": [
              {
                "code": "GetCapabilitites",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?",
                "method": "GET",
                "type": "application/xml"
              },
              {
                "code": "GetMap",
                "href": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?SERVICE=wms&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=wald_04",
                "method": "GET",
                "type": "image/png"
              }
            ],
            "styles": [
              {
                "name": "default",
                "title": "default",
                "legendURL": "https://geo5.service24.rlp.de/wms/karte_rp.fcgi?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=wald_04&format=image/png&STYLE=default"
              }
            ]
          }
        ],
        "folder": "/0/1/4"
      }
    }
  ]