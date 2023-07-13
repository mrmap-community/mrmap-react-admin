import { useResourceDefinition, List, TextInput, TextField, DateField, HttpError, useStore, useResourceContext, BooleanField, TopToolbar, SelectColumnsButton, DatagridConfigurable, FilterButton, CreateButton, ExportButton, ReferenceManyCount, ListProps, RaRecord, ArrayField, SingleFieldList, ChipField } from "react-admin";
import { JsonApiDocument, JsonApiErrorObject } from "../types/jsonapi";
import { useSearchParams } from 'react-router-dom';
import { ReactElement } from "react";


export interface FieldDefinition {
  source: string;
  dataType: string;
};


export interface ResourceListProps<RecordType extends RaRecord = any> extends ListProps {
  fields: FieldDefinition[]
};

const ListActions = () => (
  <TopToolbar>
      <SelectColumnsButton />
      <FilterButton/>
      <CreateButton/>
      <ExportButton/>
  </TopToolbar>

);

export const JsonApiList = (): ReactElement  => {
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
    <TextInput key="filter_title" label="Title contains" source="title__icontains" />,
  ];


  return (

    <List 
      actions={<ListActions />}
      filters={postFilters}
      queryOptions={{ onError, meta: {include: 'keywords'} }}
    >
      <DatagridConfigurable rowClick="edit">
        <TextField source="id"/>
        <TextField source="title"/>
        <DateField source="createdAt"/>
        <BooleanField source="isActive"></BooleanField>
        <ArrayField source="keywords">
            <SingleFieldList>
                <ChipField source="keyword" size="small" />
            </SingleFieldList>
        </ArrayField>


        {/* <ReferenceManyCount
                label="Layers"
                reference="registry/layers"
                target="service"
                link
        /> */}
      </DatagridConfigurable>
    </List>
  )

};
