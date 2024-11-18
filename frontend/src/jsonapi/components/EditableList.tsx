import { useListController, useResourceDefinition } from 'react-admin';
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

  const showFields = useFieldsForOperation(definition.options?.showOperationName ?? '')
  const editFields = useFieldsForOperation(definition.options?.editOperationName ?? '')

  
  return (
    
    
  );
}