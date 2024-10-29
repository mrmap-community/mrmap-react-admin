import { SimpleTreeView } from "@mui/x-tree-view";
import { useMemo } from "react";
import { Identifier, RaRecord, TextField, TextFieldProps, useShowController } from "react-admin";
import { useFormContext, } from "react-hook-form";
import { getSubTree } from "../utils";

export interface TreeSelectInputProps extends TextFieldProps{
  wmsId: Identifier
}



const TreeSelectInput = ({
  wmsId,
  ...rest  
}: TreeSelectInputProps) => {

  const { record } = useShowController({ id: wmsId, resource: 'WebMapService' });

  const tree = useMemo(()=> record?.layers && getSubTree(record?.layers.sort((a: RaRecord, b: RaRecord) => a.mpttLft > b.mpttLft)) || [],[record?.layers]);

  const {setValue} = useFormContext();


  return (
    <div>
    <TextField
      {...rest}          
    />
    <SimpleTreeView
        multiSelect
        checkboxSelection
        onSelectedItemsChange={(event: React.SyntheticEvent, itemIds: string[]) => setValue(rest.source, itemIds.map((v) => ({id: v}))) }
    > 
      {tree}
    </SimpleTreeView>
    </div>
 
  )

};

export default TreeSelectInput;