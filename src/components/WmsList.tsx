import { List, Datagrid, TextInput, TextField, DateField, HttpError, useStore, useResourceContext, FilterPayload, BooleanField, TopToolbar, SelectColumnsButton, DatagridConfigurable, FilterButton, CreateButton, ExportButton } from "react-admin";
import { JsonApiDocument, JsonApiErrorObject } from "../types/jsonapi";
import { useSearchParams } from 'react-router-dom';
import { ReactElement } from "react";


export const WebMapServiceList = () => {
  
  const resource = useResourceContext();
  const [listParams, setListParams]  = useStore(`${resource}.listParams`);
  const [searchParams, setSearchParams] = useSearchParams();

  const isInvalidSort = (error: JsonApiErrorObject): boolean => {
    if (error.code === 'invalid' && error.detail.includes("sort parameter")) {
      return true;
    }
    return false;
  };
  
  const onError = (error: HttpError) => {
    /**Custom error handler for jsonApi bad request response
     * 
     * possible if:
     *   - attribute is not sortable
     *   - attribute is not filterable
     * 
    */
    if (error.status == 400){
      const jsonApiDocument: JsonApiDocument = error.body;

      jsonApiDocument.errors?.forEach((apiError: JsonApiErrorObject) => {
        if (isInvalidSort(apiError)){
          console.log("unable to sort");
  
          // remove sort from storage
          const newParams = listParams;
          newParams.sort = '';
          setListParams(newParams);
          
          // remove sort from current location
          searchParams.delete('sort');
          setSearchParams(searchParams);
        }
      });
    }
  };

  const postFilters: ReactElement[] = [
    <TextInput key="search" label="Search" source="search" alwaysOn />,
    <TextInput key="search" label="Title contains" source="title" />,
  ];

  const PostListActions = () => (
    <TopToolbar>
        <SelectColumnsButton />
        <FilterButton/>
        <CreateButton/>
        <ExportButton/>
    </TopToolbar>

);


  return (

  <List 
    actions={<PostListActions />}
    filters={postFilters}
    queryOptions={{ onError }}
  >
    <DatagridConfigurable rowClick="edit">
      <TextField source="id"/>
      <TextField source="title"/>
      <DateField source="createdAt"/>
      <BooleanField source="isActive"></BooleanField>
    </DatagridConfigurable>
  </List>
)

};
