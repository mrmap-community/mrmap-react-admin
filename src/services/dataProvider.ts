import { fetchUtils, GetListParams, GetOneParams, GetManyParams, GetManyReferenceParams, CreateParams, UpdateParams, UpdateManyParams, DeleteParams, DeleteManyParams, Options, useStore, DataProvider, HttpError } from 'react-admin';
import { stringify } from 'query-string';
import { JsonApiDocument, JsonApiMimeType, JsonApiPrimaryData } from '../types/jsonapi';



export interface JsonApiDataProviderOptions extends Options {
    total?: string,
}


// TODO: merge this with passedtrough params of data provider
const options: JsonApiDataProviderOptions = {
    headers: new Headers(
        {
            'Accept': JsonApiMimeType,
            'Content-Type': JsonApiMimeType,
        }
    ),
    total: "/meta/pagination/count"
}

const getTotal = (response: JsonApiDocument): number => {
    const paths = options.total?.split("/");
    let total = 10;
    try {
        paths?.forEach((value: any) => {
            // @ts-ignore cause we climb down the json pointer
            total = response[value];
        });
    } catch (error) {
        total = 10;
    }
    if (typeof total === 'string'){
        total = parseInt(total, 10);
    }
    return total ?? 10;
};


export default (
  apiUrl:string, 
  httpClient = fetchUtils.fetchJson,
  ): DataProvider  =>  ({

   

    getList: (resource: string , params: GetListParams) => {
      const { page, perPage } = params.pagination;
      const { field, order } = params.sort;
      const query: any = {
          'page[number]': page,
          'page[size]': perPage,
          'sort': `${order == 'ASC' ? '': '-'}${field}`
      };

      Object.keys(params.filter).forEach(
        filterKey => {
          // TODO: other lookups like __icontains possible
          query[`filter[${filterKey}]`] = params.filter[filterKey]

        }
      )
            
      return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, options).then(({headers, json}) => (
        {
          // TODO: how to handle relationships?
          data: json.data.map( (value: JsonApiPrimaryData) => Object.assign(
            { id: value.id },
            value.attributes,
          )),
          total: getTotal(json),
          headers: headers
        }
      ));

    },

    getOne: (resource: string, params: GetOneParams) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, options).then(({ json }) => ({
            // TODO: how to handle relationships?
            
            data: {
                id: json.data.id,
                ...json.data.attributes
            },
        })),



    getMany: (resource: string, params: GetManyParams) => {
        const query = {
            filter: JSON.stringify({ ids: params.ids }),
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;
        return httpClient(url, options).then(({ json }) => ({ data: json }));
    },

    getManyReference: (resource: string, params: GetManyReferenceParams) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify({
                ...params.filter,
                [params.target]: params.id,
            }),
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;

        return httpClient(url, options).then(({ headers, json }) => ({
            data: json,
            total: getTotal(json),
        }));
    },

    create: (resource: string, params: CreateParams) =>
        httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: { ...params.data, id: json.id },
        })),

    update: (resource: string, params: UpdateParams) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json })),

    updateMany: (resource: string, params: UpdateManyParams) => {
        const query = {
            filter: JSON.stringify({ id: params.ids}),
        };
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'PUT',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },

    delete: (resource: string, params: DeleteParams) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json })),

    deleteMany: (resource: string, params: DeleteManyParams) => {
        const query = {
            filter: JSON.stringify({ id: params.ids}),
        };
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'DELETE',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },
});
