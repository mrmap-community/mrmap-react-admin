import { type CreateParams, type DataProvider, type DeleteManyParams, type DeleteParams, type GetListParams, type GetManyParams, type GetManyReferenceParams, type GetOneParams, HttpError, type Identifier, type Options, type RaRecord, type UpdateManyParams, type UpdateParams } from 'react-admin'

import jsonpointer from 'jsonpointer'
import { type AxiosError, AxiosHeaders, type OpenAPIClient, type ParamsArray } from 'openapi-client-axios'

import { type JsonApiDocument, type JsonApiErrorObject, JsonApiMimeType, type JsonApiPrimaryData } from '../jsonapi/types/jsonapi'
import { capsulateJsonApiPrimaryData, encapsulateJsonApiPrimaryData } from '../jsonapi/utils'
import { TOKENNAME } from './authProvider'

export interface JsonApiDataProviderOptions extends Options {
  entrypoint: string
  realtimeBus?: string

  httpClient: Promise<OpenAPIClient>
  total?: string
  headers?: AxiosHeaders
}

type EventTypes = 'created' | 'updated' | 'deleted'

export interface MrMapMessage {
  topic: string
  event: {
    type: EventTypes
    payload: {
      ids: Identifier[]
      records?: JsonApiPrimaryData[]
    }
  }
}

export interface CrudEvent {
  type: EventTypes
  payload: {
    ids: Identifier[] // basic event type https://marmelab.com/react-admin/RealtimeDataProvider.html#crud-events
    records?: RaRecord[] // custom extension to provide the records which are passed by the real time bus
  }
}

export interface CrudMessage {
  topic: string
  event: CrudEvent
}

export interface Subscription {
  topic: string
  callback: (event: CrudEvent) => void
}

let subscriptions: Subscription[] = []

const checkAuth = (headers: AxiosHeaders): string => {
  const token = localStorage.getItem(TOKENNAME) ?? ''

  if (token !== '') {
    try {
      const tokenValue: string = JSON.parse(token).token ?? ''
      headers.setAuthorization(`Token ${tokenValue}`)
      return tokenValue
    } catch (error) {
      localStorage.removeItem(TOKENNAME)
      // TODO: redirect to login page
    }
  }
  return token
}

const handleApiError = (error: AxiosError): void => {
  if (error.response?.status === 403) {
    const apiErrors = error.response?.data as JsonApiDocument
    apiErrors?.errors?.forEach(
      (apiError: JsonApiErrorObject) => {
        if (apiError.detail === 'Invalid token.') {
          localStorage.removeItem(TOKENNAME)
          window.location.href = '/login'
        }
      }
    )
  }
}

const getTotal = (response: JsonApiDocument, total: string): number => {
  const _total = jsonpointer.get(response, total)
  if (typeof _total === 'string') {
    return parseInt(_total, 10)
  }
  return _total
}

const realtimeOnMessage = (event: MessageEvent): void => {
  const data = JSON.parse(event?.data) as MrMapMessage
  console.log('reseved message', data)

  const raEvent = { ...data.event }
  raEvent.payload.records = data.event.payload.records?.map(jsonApiPrimaryData => encapsulateJsonApiPrimaryData(undefined, jsonApiPrimaryData))

  console.log('subs: ', subscriptions, subscriptions.filter(
    subscription =>
      subscription.topic === data.topic))
  // fire callback functions
  subscriptions.filter(
    subscription =>
      subscription.topic === data.topic)
    .forEach(
      observer => { observer.callback(raEvent) })
}

const dataProvider = ({
  headers = new AxiosHeaders(
    {
      Accept: JsonApiMimeType,
      'Content-Type': JsonApiMimeType

    }
  ),
  total = '/meta/pagination/count',
  realtimeBus = '',
  httpClient,
  ...rest
}: JsonApiDataProviderOptions): DataProvider => {
  const token = checkAuth(headers)

  if (realtimeBus !== '' && token !== '') {
    const socket = new WebSocket(`${realtimeBus}?token=${token}`)
    socket.onopen = (event) => { console.log('open', event) }
    socket.onmessage = realtimeOnMessage
    socket.onerror = (event) => { console.log('error', event) }
  }

  // TODO: get baseURL from open api client
  const axiosRequestConf = { baseURL: rest.entrypoint, headers }

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

      for (const [filterName, filterValue] of Object.entries(params.filter)) {
        const value = filterValue as string
        parameters.push({ name: `filter[${filterName}]`, value })
      }

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
            total: getTotal(jsonApiDocument, total)
          }
        }).catch((error: AxiosError) => {
          handleApiError(error)
          return { data: [], total: 0 }
        })
    },

    getOne: async (resource: string, params: GetOneParams) => {
      if (params.id === undefined) {
        return { data: { id: '' } }
      }
      return await httpClient.then(async (client) => {
        const parameters: ParamsArray = [{
          name: 'id',
          value: params.id,
          in: 'path'
        }]
        // json:api specific stuff like 'include' or 'fields[Resource]'
        Object.entries(params.meta?.jsonApiParams ?? {}).forEach(([key, value]) => { parameters.push({ name: key, value: typeof value === 'string' ? value : '' }) })

        const conf = client.api.getAxiosConfigForOperation(`retrieve_${resource}`, [parameters, undefined, axiosRequestConf])
        return await client.request(conf)
      }).then((response) => {
        const jsonApiDocument = response.data as JsonApiDocument
        const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
        return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource) }
      })
    },

    getMany: async (resource: string, params: GetManyParams) => {
      // TODO: pk is not always id...
      const parameters: ParamsArray = [
        { name: 'filter[id.in]', value: params.ids.join(',') },
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
            total: getTotal(jsonApiDocument, total)
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
      }).catch(error => {
        if (error.response.status === 400) {
          const jsonApiErrors: JsonApiErrorObject[] = error.response.data.errors
          const fieldErrors: any = {}
          const formErrors: string[] = []
          jsonApiErrors?.forEach(e => {
            const pointer = e.source?.pointer
            if (['/data/attributes', '/data/relationships'].some(v => pointer?.includes(v))) {
              // TODO: field error
              const fieldName = pointer?.replace('/data/attributes/', '').replace('/data/relationships/', '')
              if (fieldName !== undefined) {
                fieldErrors[fieldName] = e.detail
              } else {
                formErrors.push(e.detail)
              }
            }
          })
          // TODO: translate message
          throw new HttpError(
            'Bad Request',
            error.response.status,
            { errors: fieldErrors }
          )
        }
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
    },

    // async realtime features
    subscribe: async (topic: string, callback: (event: CrudEvent) => void) => {
      subscriptions.push({ topic, callback })
      return await Promise.resolve({ data: null })
    },
    unsubscribe: async (topic: string, callback: (event: CrudEvent) => void) => {
      subscriptions = subscriptions.filter(
        subscription =>
          subscription.topic !== topic ||
          subscription.callback !== callback
      )
      return await Promise.resolve({ data: null })
    },
    publish: async (topic: string, event: CrudEvent) => {
      if (topic === undefined || topic === '') {
        return await Promise.reject(new Error('missing topic'))
      }
      if (event.type === undefined) {
        return await Promise.reject(new Error('missing event type'))
      }
      subscriptions.forEach(
        subscription => {
          topic === subscription.topic &&
            subscription.callback(event)
        }
      )
      return await Promise.resolve({ data: null })
    }
  }
}

export default dataProvider
