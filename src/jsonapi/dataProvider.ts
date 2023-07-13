import { fetchUtils, GetListParams, GetOneParams, GetManyParams, GetManyReferenceParams, CreateParams, UpdateParams, UpdateManyParams, DeleteParams, DeleteManyParams, Options, useStore, DataProvider, HttpError } from 'react-admin';
import { stringify } from 'query-string';
import { JsonApiDocument, JsonApiMimeType, JsonApiPrimaryData } from './types/jsonapi';
import { capsulateJsonApiPrimaryData, encapsulateJsonApiPrimaryData } from './utils';
import jsonpointer from 'jsonpointer';


export interface JsonApiDataProviderOptions extends Options {
    apiUrl: string;
    httpClient?: Function;
    total?: string;
    headers?: Headers;
}

export default (options: JsonApiDataProviderOptions): DataProvider  =>  {
    const opts = {
      httpClient: fetchUtils.fetchJson,
      headers: new Headers(
            {
                'Accept': JsonApiMimeType,
                'Content-Type': JsonApiMimeType,
            }
      ),
      total: "/meta/pagination/count",
      ...options,
    };
    const httpClient = opts.httpClient;


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

                
        return httpClient(`${opts.apiUrl}/${resource}?${stringify(query)}`, {headers: opts.headers}
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

        getOne: (resource: string, params: GetOneParams) =>
            httpClient(
                `${opts.apiUrl}/${resource}/${params.id}`, 
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

            return httpClient(`${opts.apiUrl}/${resource}?${stringify(query)}`, {headers: opts.headers}
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
            httpClient(`${opts.apiUrl}/${resource}`, {
                method: 'POST',
                body: JSON.stringify({data: capsulateJsonApiPrimaryData(params.data, params.meta.type)}),
                headers: opts.headers
            }).then(
                ({json } : {json: JsonApiDocument}) => ({ data: encapsulateJsonApiPrimaryData(json, json.data as JsonApiPrimaryData) })
            ),

        update: (resource: string, params: UpdateParams) =>
            httpClient(`${opts.apiUrl}/${resource}/${params.id}`, {
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
            httpClient(`${opts.apiUrl}/${resource}/${params.id}`, {
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
    }
};
