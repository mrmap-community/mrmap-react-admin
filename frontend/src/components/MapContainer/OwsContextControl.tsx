import { useEffect } from 'react'
import { Identifier, RaRecord, useGetMany, useStore } from "react-admin"
import { useOwsContextBase } from "../../react-ows-lib/ContextProvider/OwsContextBase"


import { updateOrAppendSearchParam } from '../../ows-lib/OwsContext/utils'

const OwsContextControl = () => {
  const { addWMSByUrl } = useOwsContextBase()

  const [pendingWmsIds, setPendingWmsIds] = useStore<Identifier[]>(`mrmap.mapviewer.append.wms`, [])
  const { data: pendingWms } = useGetMany(
    "WebMapService",
    { 
      ids: pendingWmsIds, 
      meta: {
        "jsonApiParams": {
          "include": "operationUrls",
          // FIXME fields are not included if we use sparsefields: "fields[WebMapService]": "operationUrls",
        }
      }
    },
  );

  useEffect(() => {
    if (pendingWms !== undefined && pendingWms?.length > 0){
      pendingWms.forEach(
        wms => {
          const getCapabilititesUrl = wms.operationUrls.find(
            (opUrl: RaRecord) => {
              return opUrl.method === "Get" && opUrl.operation === "GetCapabilities"
            })?.url
          if (getCapabilititesUrl !== undefined){
            const url = new URL(getCapabilititesUrl)
            const params = url.searchParams
            updateOrAppendSearchParam(params, 'SERVICE', 'wms')
            updateOrAppendSearchParam(params, 'VERSION', wms.version)
            updateOrAppendSearchParam(params, 'REQUEST', 'GetCapabilities')
           
            addWMSByUrl(url.href)
          }
        }
      )
      setPendingWmsIds([])
    }
  }, [pendingWms])

  return null
}

export default OwsContextControl