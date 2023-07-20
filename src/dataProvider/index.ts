import { fetchUtils, GetListParams, GetOneParams, GetManyParams, GetManyReferenceParams, CreateParams, UpdateParams, UpdateManyParams, DeleteParams, DeleteManyParams, Options, useStore, DataProvider, HttpError } from 'react-admin';
import { stringify } from 'query-string';
import { JsonApiDocument, JsonApiMimeType, JsonApiPrimaryData } from '../jsonapi/types/jsonapi';
import { capsulateJsonApiPrimaryData, encapsulateJsonApiPrimaryData } from '../jsonapi/utils';
import jsonpointer from 'jsonpointer';
import { invokeOperation } from './invokeOperation';
import { introspect } from "../introspect";
import OpenAPIClientAxios from 'openapi-client-axios';
import { ApiPlatformAdminDataProvider, ApiPlatformAdminRecord, OpenApiDataProviderFactoryParams } from '@api-platform/admin/lib/types';

export interface JsonApiDataProviderOptions extends Options {
    entrypoint: string;
    docUrl: string;
    httpClient?: OpenAPIClientAxios;
    total?: string;
    headers?: Headers;
}

export default (options: JsonApiDataProviderOptions): ApiPlatformAdminDataProvider  =>  {
    const opts = {
      httpClient: new OpenAPIClientAxios({ definition: options.docUrl }),
      headers: new Headers(
            {
                'Accept': JsonApiMimeType,
                'Content-Type': JsonApiMimeType,
            }
      ),
      total: "/meta/pagination/count",
      ...options,
    };
    const httpClient = opts.httpClient.init();
    console.log("httpClient", httpClient);

    
    const getTotal = (response: JsonApiDocument): number => {
        const total = jsonpointer.get(response, opts.total)

        if (typeof total === 'string'){
            return parseInt(total, 10);
        }
        return total;
    };


    return {
        getList: (resource: string , params: GetListParams) => {

            const { page, perPage } = params.pagination;
            const { field, order } = params.sort;
            const query: any = {
                'page[number]': page,
                'page[size]': perPage,
                'sort': `${order == 'ASC' ? '': '-'}${field}`,
                'include': params.meta?.include
            };

            for (const [filterName, filterValue] of Object.entries(params.filter)){
                query[`filter[${filterName}]`] = filterValue
            }
            return invokeOperation({
                operationId: `list_${resource}`,
                parameters: query,
                resolveClient: httpClient,
                apiUrl: opts.entrypoint
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

        getOne: (resource: string, params: GetOneParams) =>
            httpClient(
                `${opts.entrypoint}/${resource}/${params.id}`, 
                {headers: opts.headers}
            ).then(
                ( {json } : {json: JsonApiDocument}) => ({ data: encapsulateJsonApiPrimaryData(json, json.data as JsonApiPrimaryData) })
            ),



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
            httpClient(`${opts.entrypoint}/${resource}`, {
                method: 'POST',
                body: JSON.stringify({data: capsulateJsonApiPrimaryData(params.data, params.meta.type)}),
                headers: opts.headers
            }).then(
                ({json } : {json: JsonApiDocument}) => ({ data: encapsulateJsonApiPrimaryData(json, json.data as JsonApiPrimaryData) })
            ),

        update: (resource: string, params: UpdateParams) =>
            httpClient(`${opts.entrypoint}/${resource}/${params.id}`, {
                // TODO: resource name is not the correct JsonApi Type here...
                method: 'PATCH',
                body: JSON.stringify({data: capsulateJsonApiPrimaryData(params.data, params.meta.type)}),
                headers: opts.headers
            }).then(
                ({json } : {json: JsonApiDocument}) => ({ data: encapsulateJsonApiPrimaryData(json, json.data as JsonApiPrimaryData) })
            ),

        updateMany: (resource: string, params: UpdateManyParams) => {
            // const query = {
            //     filter: JSON.stringify({ id: params.ids}),
            // };
            // return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            //     method: 'PUT',
            //     body: JSON.stringify(params.data),
            // }).then(({ json }) => ({ data: json }));
        },

        delete: (resource: string, params: DeleteParams) =>
            httpClient(`${opts.entrypoint}/${resource}/${params.id}`, {
                method: 'DELETE',
                headers: opts.headers
            }).then(
                ({json } : {json: JsonApiDocument}) => ({ data: json })
            ),

        deleteMany: (resource: string, params: DeleteManyParams) => {
            // const query = {
            //     filter: JSON.stringify({ id: params.ids}),
            // };
            // return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            //     method: 'DELETE',
            //     body: JSON.stringify(params.data),
            // }).then(({ json }) => ({ data: json }));
        },
        introspect: introspect.bind(undefined, opts.docUrl),
        subscribe:(
            resourceIds: string[],
            callback: (document: ApiPlatformAdminRecord) => void,
          ) => Promise.resolve({ data: null }),
        unsubscribe: (_resource: string, resourceIds: string[]) => Promise.resolve({ data: null })
    }
};
