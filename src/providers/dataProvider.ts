import { type CreateParams, type DataProvider, type DeleteManyParams, type DeleteParams, type GetListParams, type GetManyParams, type GetManyReferenceParams, type GetOneParams, type Identifier, type Options, type UpdateManyParams, type UpdateParams } from 'react-admin'

import jsonpointer from 'jsonpointer'
import { type AxiosError, AxiosHeaders, type OpenAPIClient, type ParamsArray } from 'openapi-client-axios'

import { type JsonApiDocument, type JsonApiErrorObject, JsonApiMimeType, type JsonApiPrimaryData } from '../jsonapi/types/jsonapi'
import { capsulateJsonApiPrimaryData, encapsulateJsonApiPrimaryData } from '../jsonapi/utils'
import { TOKENNAME } from './authProvider'

export interface JsonApiDataProviderOptions extends Options {
  entrypoint: string
  httpClient: Promise<OpenAPIClient>
  total?: string
  headers?: AxiosHeaders
}

export default (options: JsonApiDataProviderOptions): DataProvider => {
  const opts = {
    headers: new AxiosHeaders(
      {
        Accept: JsonApiMimeType,
        'Content-Type': JsonApiMimeType

      }
    ),
    total: '/meta/pagination/count',
    ...options
  }
  const token = localStorage.getItem(TOKENNAME) ?? ''

  if (token !== '') {
    try {
      const tokenValue: string = JSON.parse(token).token ?? ''
      opts.headers.setAuthorization(`Token ${tokenValue}`)
    } catch (error) {
      localStorage.removeItem(TOKENNAME)
    }
  }

  // TODO: get baseURL from open api client
  const axiosRequestConf = { baseURL: opts.entrypoint, headers: opts.headers }
  const httpClient = opts.httpClient

  const getTotal = (response: JsonApiDocument): number => {
    const total = jsonpointer.get(response, opts.total)
    if (typeof total === 'string') {
      return parseInt(total, 10)
    }
    return total
  }

  const handleApiError = (error: AxiosError): void => {
    if (error.response?.status === 403) {
      const apiErrors = error.response?.data as JsonApiDocument
      apiErrors?.errors?.forEach(
        (apiError: JsonApiErrorObject) => {
          if (apiError.detail === 'Invalid token.') {
            localStorage.removeItem(TOKENNAME)
          }
        }
      )
    }
  }

  const updateResource = async (resource: string, params: UpdateParams): Promise<{ data: any }> =>
    await httpClient.then(async (client) => {
      const operationId = `partial_update_${resource}`
      const operation = client.api.getOperation(operationId)

      // FIXME: only post the edited fields for partial update

      const conf = client.api.getAxiosConfigForOperation(operationId, [{ id: params.id }, { data: capsulateJsonApiPrimaryData(params.data, resource, operation) }, axiosRequestConf])
      return await client.request(conf)
    }).then((response) => {
      const jsonApiDocument = response.data as JsonApiDocument
      const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
      return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource) }
    })

  const deleteResource = async (resource: string, params: DeleteParams): Promise<{ data: any }> =>
    await httpClient.then(async (client) => {
      const conf = client.api.getAxiosConfigForOperation(`delete_${resource}`, [{ id: params.id }, undefined, axiosRequestConf])
      return await client.request(conf)
    }).then((response) => {
      const jsonApiDocument = response.data as JsonApiDocument
      const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
      return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource) }
    })

  return {
    getList: async (resource: string, params: GetListParams) => {
      let operationId = `list_${resource}`
      const relatedResource = params.meta?.relatedResource

      const { page, perPage } = params.pagination
      const { field, order } = params.sort

      const parameters: ParamsArray = [
        { name: 'page[number]', value: page },
        { name: 'page[size]', value: perPage },
        { name: 'sort', value: `${order === 'ASC' ? '' : '-'}${field}` }
      ]

      // json:api specific stuff like 'include' or 'fields[Resource]'
      Object.entries(params.meta?.jsonApiParams ?? {}).forEach(([key, value]) => { parameters.push({ name: key, value: typeof value === 'string' ? value : '' }) })

      for (const [filterName, filterValue] of Object.entries(params.filter)) {
        const _filterValue = filterValue as string

        parameters.push(
          { name: `filter[${filterName.includes('_filter_lookup_') ? filterName.replace('_filter_lookup_', '.') : filterName}]`, value: _filterValue }
        )
      }

      if (relatedResource !== undefined) {
        parameters.push({ name: `${relatedResource.resource}Id`, value: relatedResource.id, in: 'path' })
        operationId = `list_related_${resource}_of_${relatedResource.resource}`
      }

      return await httpClient.then(async (client) => {
        const conf = client.api.getAxiosConfigForOperation(operationId, [parameters, undefined, axiosRequestConf])
        return await client.request(conf)
      })
        .then((response) => {
          const jsonApiDocument = response.data as JsonApiDocument
          const resources = jsonApiDocument.data as JsonApiPrimaryData[]
          return {
            data: resources.map((data: JsonApiPrimaryData) => Object.assign(
              encapsulateJsonApiPrimaryData(jsonApiDocument, data)
            )),
            total: getTotal(jsonApiDocument)
          }
        }).catch((error: AxiosError) => {
          handleApiError(error)
        }).finally(() => { return { data: [], total: 0 } })
    },

    getOne: async (resource: string, params: GetOneParams) => await httpClient.then(async (client) => {
      const parameters: ParamsArray = [{
        name: 'id',
        value: params.id,
        in: 'path'
      }]
      console.log('params', params)
      // json:api specific stuff like 'include' or 'fields[Resource]'
      Object.entries(params.meta?.jsonApiParams ?? {}).forEach(([key, value]) => { parameters.push({ name: key, value: typeof value === 'string' ? value : '' }) })

      const conf = client.api.getAxiosConfigForOperation(`retrieve_${resource}`, [parameters, undefined, axiosRequestConf])
      return await client.request(conf)
    }).then((response) => {
      const jsonApiDocument = response.data as JsonApiDocument
      const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
      return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource) }
    }),

    getMany: async (resource: string, params: GetManyParams) => {
      // TODO: pk is not always id...
      const parameters: ParamsArray = [
        { name: 'filter[id.in]', value: params.ids.map(_id => _id.id).join(',') },
        { name: 'include', value: params.meta?.include }
      ]

      return await httpClient.then(async (client) => {
        const conf = client.api.getAxiosConfigForOperation(`list_${resource}`, [parameters, undefined, axiosRequestConf])
        return await client.request(conf)
      })
        .then((response) => {
          const jsonApiDocument = response.data as JsonApiDocument
          const resources = jsonApiDocument.data as JsonApiPrimaryData[]
          return {
            data: resources.map((data: JsonApiPrimaryData) => Object.assign(
              encapsulateJsonApiPrimaryData(jsonApiDocument, data)
            ))
          }
        })
    },

    getManyReference: async (resource: string, params: GetManyReferenceParams) => {
      const { page, perPage } = params.pagination
      const { field, order } = params.sort
      const query: any = {
        'page[number]': page,
        'page[size]': perPage,
        sort: `${order === 'ASC' ? '' : '-'}${field}`
      }

      for (const [filterName, filterValue] of Object.entries(params.filter)) {
        query[`filter[${filterName}]`] = filterValue
      }

      query[`filter[${params.target}]`] = params.id

      return await httpClient.then(async (client) => {
        const conf = client.api.getAxiosConfigForOperation(`list_${resource}`, [query, undefined, axiosRequestConf])
        return await client.request(conf)
      })
        .then((response) => {
          const jsonApiDocument = response.data as JsonApiDocument
          const resources = jsonApiDocument.data as JsonApiPrimaryData[]
          return {
            data: resources.map((data: JsonApiPrimaryData) => Object.assign(
              encapsulateJsonApiPrimaryData(jsonApiDocument, data)
            )),
            total: getTotal(jsonApiDocument)
          }
        })
    },

    create: async (resource: string, params: CreateParams) =>
      await httpClient.then(async (client) => {
        const operationId = `create_${resource}`
        const operation = client.api.getOperation(operationId)

        const conf = client.api.getAxiosConfigForOperation(`create_${resource}`, [undefined, { data: capsulateJsonApiPrimaryData(params.data, resource, operation) }, axiosRequestConf])
        return await client.request(conf)
      }).then((response) => {
        const jsonApiDocument = response.data as JsonApiDocument
        const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
        return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource) }
      }),

    update: async (resource: string, params: UpdateParams) =>
      await updateResource(resource, params),

    updateMany: async (resource: string, params: UpdateManyParams) => {
      // Hacky many update via for loop. JSON:API does not support many update in a single transaction.
      const results: Identifier[] = []
      params.ids.forEach(async (id) => {
        await updateResource(
          resource,
          {
            id,
            data: params.data,
            previousData: undefined
          }
        ).then(() => {
          results.push(id)
        })
      }
      )
      return await Promise.resolve({ data: results })
    },

    delete: async (resource: string, params: DeleteParams) =>
      await deleteResource(resource, params),
    deleteMany: async (resource: string, params: DeleteManyParams) => {
      const results: Identifier[] = []
      params.ids.forEach(async (id) => {
        await deleteResource(
          resource, { id }
        ).then(() => {
          results.push(id)
        })
      }
      )
      return await Promise.resolve({ data: results })
    }
  }
}
