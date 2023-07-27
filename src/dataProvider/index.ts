import { GetListParams, GetOneParams, GetManyParams, GetManyReferenceParams, CreateParams, UpdateParams, UpdateManyParams, DeleteParams, DeleteManyParams, Options, useStore, DataProvider, HttpError, Identifier } from 'react-admin';
import { stringify } from 'query-string';
import { JsonApiDocument, JsonApiMimeType, JsonApiPrimaryData } from '../jsonapi/types/jsonapi';
import { capsulateJsonApiPrimaryData, encapsulateJsonApiPrimaryData } from '../jsonapi/utils';
import jsonpointer from 'jsonpointer';
import { introspect } from "../introspect";
import OpenAPIClientAxios, { AxiosHeaders, ParamsArray } from 'openapi-client-axios';
import { ApiPlatformAdminDataProvider, ApiPlatformAdminRecord } from '@api-platform/admin/lib/types';
import { update } from 'lodash';

export interface JsonApiDataProviderOptions extends Options {
    entrypoint: string;
    docUrl: string;
    httpClient?: OpenAPIClientAxios;
    total?: string;
    headers?: AxiosHeaders;
}

export default (options: JsonApiDataProviderOptions): ApiPlatformAdminDataProvider  =>  {
    const opts = {
      httpClient: new OpenAPIClientAxios({ definition: options.docUrl }),
      headers: new AxiosHeaders(
            {
                'Accept': JsonApiMimeType,
                'Content-Type': JsonApiMimeType,
            }
      ),
      total: "/meta/pagination/count",
      ...options,
    };
    const axiosRequestConf = {baseURL: opts.entrypoint, headers: opts.headers}
    const httpClient = opts.httpClient.init();
    
    const getTotal = (response: JsonApiDocument): number => {
        const total = jsonpointer.get(response, opts.total)
        if (typeof total === 'string'){
            return parseInt(total, 10);
        }
        return total;
    };

    const updateResource = (resource: string, params: UpdateParams) => 
        httpClient.then((client)=> {
            const operationId = `partial_update_${resource}`;
            const operation = client.api.getOperation(operationId);

            // FIXME: only post the edited fields for partial update

            const conf = client.api.getAxiosConfigForOperation(`partial_update_${resource}`, [{'id': params.id}, capsulateJsonApiPrimaryData(params.data, resource, operation), axiosRequestConf])
            return client.request(conf)
        }).then((response) => {
            const jsonApiDocument = response.data as JsonApiDocument;
            const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
            return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource)}
        });

    const deleteResource = (resource: string, params: DeleteParams) =>
        httpClient.then((client)=> {
            const conf = client.api.getAxiosConfigForOperation(`delete_${resource}`, [{'id': params.id}, undefined, axiosRequestConf])
            return client.request(conf)
        }).then((response) => {
            const jsonApiDocument = response.data as JsonApiDocument;
            const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
            return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource)}
        });

    return {
        getList: (resource: string , params: GetListParams) => {
            const { page, perPage } = params.pagination;
            const { field, order } = params.sort;
            const parameters: ParamsArray = [
                {name: 'page[number]', value: page},
                {name: 'page[size]', value: perPage},
                {name: 'sort', value: `${order == 'ASC' ? '': '-'}${field}`},
                {name: 'include', value: params.meta?.include}
            ];
            for (const [filterName, filterValue] of Object.entries(params.filter)){
                const _filterValue = filterValue as string;
                
                parameters.push(
                    {name: `filter[${filterName.includes("_filter_lookup_")? filterName.replace("_filter_lookup_", ".") : filterName}]`, value: _filterValue}
                )
                

                
            }

            return httpClient.then((client)=> {
                const conf = client.api.getAxiosConfigForOperation( `list_${resource}`, [parameters, undefined, axiosRequestConf])
                return client.request(conf)
            }).then((response)=> {
                const jsonApiDocument = response.data as JsonApiDocument;
                const resources = jsonApiDocument.data as JsonApiPrimaryData[]
                return {
                    data: resources.map( (data: JsonApiPrimaryData) => Object.assign(
                        encapsulateJsonApiPrimaryData(jsonApiDocument, data)
                    )),
                    total: getTotal(jsonApiDocument),
                }
            })      

        },

        getOne: (resource: string, params: GetOneParams) => httpClient.then((client)=> {
                const conf = client.api.getAxiosConfigForOperation(`retrieve_${resource}`, [{'id': params.id}, undefined, axiosRequestConf])
                return client.request(conf)
            }).then((response) => {
                const jsonApiDocument = response.data as JsonApiDocument;
                const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
                return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource)}
            }),
            
        getMany: (resource: string, params: GetManyParams) => {
            // const query = {
            //     filter: JSON.stringify({ ids: params.ids }),
            // };
            // const url = `${apiUrl}/${resource}?${stringify(query)}`;
            // return httpClient(url, options).then(({ json }) => ({ data: json }));
        },

        getManyReference: (resource: string, params: GetManyReferenceParams) => {

            const { page, perPage } = params.pagination;
            const { field, order } = params.sort;
            const query: any = {
                'page[number]': page,
                'page[size]': perPage,
                'sort': `${order == 'ASC' ? '': '-'}${field}`
            };

            for (const [filterName, filterValue] of Object.entries(params.filter)){
                query[`filter[${filterName}]`] = filterValue
            }

            query[`filter[${params.target}]`] = params.id

            return httpClient(`${opts.entrypoint}/${resource}?${stringify(query)}`, {headers: opts.headers}
            ).then(({json}: {json: JsonApiDocument}) => {
                const resources = json.data as JsonApiPrimaryData[]
                return {
                    data: resources.map( (data: JsonApiPrimaryData) => Object.assign(
                        encapsulateJsonApiPrimaryData(json, data)
                    )),
                    total: getTotal(json),
                }
            });
        },

        create: (resource: string, params: CreateParams) =>
            httpClient.then((client)=> {
                const operationId = `create_${resource}`;
                const operation = client.api.getOperation(operationId);

                const conf = client.api.getAxiosConfigForOperation(`create_${resource}`, [undefined, capsulateJsonApiPrimaryData(params.data, resource, operation), axiosRequestConf])
                return client.request(conf)
            }).then((response) => {
                const jsonApiDocument = response.data as JsonApiDocument;
                const jsonApiResource = jsonApiDocument.data as JsonApiPrimaryData
                return { data: encapsulateJsonApiPrimaryData(jsonApiDocument, jsonApiResource)}
            }),

        update: (resource: string, params: UpdateParams) =>
            updateResource(resource, params),

        updateMany: (resource: string, params: UpdateManyParams) => {
            // Hacky many update via for loop. JSON:API does not support many update in a single transaction. 
            const results: Identifier[] = []
            params.ids.forEach((id) => 
                updateResource(
                    resource,
                    {
                        id: id,
                        data: params.data,
                        previousData: undefined
                    }
                ).then(() => {
                    results.push(id);
                })
            )
            return Promise.resolve({data: results});

        },

        delete: (resource: string, params: DeleteParams) =>
            deleteResource(resource, params),
        deleteMany: (resource: string, params: DeleteManyParams) => {
            const results: Identifier[] = []
            params.ids.forEach((id) => 
                deleteResource(
                    resource, {id: id,}
                ).then(() => {
                    results.push(id);
                })
            )
            return Promise.resolve({data: results});
        },
        introspect: introspect.bind(undefined, opts.docUrl),
        subscribe:(
            resourceIds: string[],
            callback: (document: ApiPlatformAdminRecord) => void,
          ) => Promise.resolve({ data: null }),
        unsubscribe: (_resource: string, resourceIds: string[]) => Promise.resolve({ data: null })
    }
};
