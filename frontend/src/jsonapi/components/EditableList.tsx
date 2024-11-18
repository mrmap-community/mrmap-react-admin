import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useCallback, useState } from 'react';
import { Identifier, RaRecord, useListController, useResourceDefinition } from 'react-admin';
import { useFieldsForOperation } from '../hooks/useFieldsForOperation';


export interface EditableDatagridProps {
  resource: string
}


const EditableDatagrid = (
  { 
    resource
  }: EditableDatagridProps
) => {
  
  const definition = useResourceDefinition({resource: resource})

  const { data, page, total, setPage, isPending } = useListController({
    resource: resource,
    //sort: { field: 'published_at', order: 'DESC' },
    //perPage: 10,
  });

  const [editRows, setEditRows] = useState<Identifier[]>([])

  const showFields = useFieldsForOperation(definition.options?.showOperationName ?? '')
  const editFields = useFieldsForOperation(definition.options?.editOperationName ?? '')

  const onEditRowClicked = useCallback((record: RaRecord)=>{
    setEditRows([...editRows, record.id])
  },[editRows, setEditRows])

  console.log(editRows)
  
  return (
    
   
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Dessert (100g serving)</TableCell>
            <TableCell align="right">Calories</TableCell>
            <TableCell align="right">Fat&nbsp;(g)</TableCell>
            <TableCell align="right">Carbs&nbsp;(g)</TableCell>
            <TableCell align="right">Protein&nbsp;(g)</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map((record) => (
            <TableRow
              key={record.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              


              <TableCell component="th" scope="row">
                {record.name}
              </TableCell>
              <TableCell align="right">{record.calories}</TableCell>
              <TableCell align="right">{record.fat}</TableCell>
              <TableCell align="right">{record.carbs}</TableCell>
              <TableCell align="right">{record.protein}</TableCell>
              <TableCell align="right"><IconButton onClick={()=>onEditRowClicked(record)}> <EditIcon/></IconButton></TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
          
  )
}

export default EditableDatagrid