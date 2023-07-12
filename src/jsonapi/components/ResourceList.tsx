import { useResourceDefinition, List, TextInput, TextField, DateField, HttpError, useStore, useResourceContext, BooleanField, TopToolbar, SelectColumnsButton, DatagridConfigurable, FilterButton, CreateButton, ExportButton } from "react-admin";
import { JsonApiDocument, JsonApiErrorObject } from "../types/jsonapi";
import { useSearchParams } from 'react-router-dom';
import { ReactElement } from "react";


const ListActions = () => (
  <TopToolbar>
      <SelectColumnsButton />
      <FilterButton/>
      <CreateButton/>
      <ExportButton/>
  </TopToolbar>

);

export const ResourceList = () => {
  /** json:api specific list component to handle json:api resources
   * 
   */
  
  const resource = useResourceContext();
  const def = useResourceDefinition();

  const jsonApiType = def.options?.type;


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


  return (

    <List 
      actions={<ListActions />}
      filters={postFilters}
      queryOptions={{ onError, meta: {type: jsonApiType} }}
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
