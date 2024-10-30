import Typography from '@mui/material/Typography';
import { SimpleTreeView } from "@mui/x-tree-view";
import { useMemo } from "react";
import { Identifier, Loading, RaRecord, sanitizeFieldRestProps, TextFieldProps, useInput, useShowController } from "react-admin";
import { useFormContext, } from "react-hook-form";
import { getDescendants } from '../MapViewer/utils';
import { getSubTree } from "../utils";

export interface TreeSelectInputProps extends TextFieldProps{
  wmsId: Identifier
}



const TreeSelectInput = ({
  wmsId = '',
  source,
  ...props  
}: TreeSelectInputProps) => {
  const { className, emptyText, ...rest } = props;

  const {setValue} = useFormContext();

  const { record, isLoading } = useShowController({ id: wmsId, resource: 'WebMapService', queryOptions: {meta: {jsonApiParams: {include: 'layers'}}} });
  const layerListPreOrderd = useMemo(()=>record?.layers.sort((a: RaRecord, b: RaRecord) => a.mpttLft > b.mpttLft) || [], [record?.layers])
  
  const tree = useMemo(()=> getSubTree(layerListPreOrderd), [layerListPreOrderd]);
  

  //TODO: display invalid and errors
  const { id, field: {value}, fieldState: {invalid, error} } = useInput({ source });

  const selectedItems = useMemo<string[]>(()=>value?.map((r: RaRecord) => r?.id?.toString()).filter((id: string) => id !== undefined) ?? [], [value])

  return (
    <Typography
      component="span"
      variant="body2"
      className={className}
      {...sanitizeFieldRestProps(rest)}
    >
      {isLoading ? <Loading loadingSecondary='loading layers'/>: null}
      <SimpleTreeView
        id={id}
        multiSelect
        checkboxSelection
        selectedItems={selectedItems}
        onItemSelectionToggle={(event: React.SyntheticEvent, itemId: string, isSelected: boolean) => {
          const node = layerListPreOrderd.find((r: RaRecord) => r.id === itemId)
          const children = getDescendants(layerListPreOrderd, node, true).map((r: RaRecord) => r.id.toString())
          if (isSelected){
            setValue(source, [...new Set([...selectedItems, ...children])].map(id => ({id: id})))
          } else {
            setValue(source, selectedItems.filter((itemId: string) => !children.includes(itemId)).map(id => ({id: id})))
          }

        }}
        //onSelectedItemsChange={(event: React.SyntheticEvent, itemIds: string[]) => setValue(source, itemIds.map((v) => ({id: v}))) }
      > 
        {tree}
      </SimpleTreeView> 
    </Typography>
  )
};

export default TreeSelectInput;