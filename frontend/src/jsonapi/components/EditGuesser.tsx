import { createElement, type ReactElement, useMemo } from 'react';
import { Edit, type EditProps, RaRecord, SimpleForm, useRecordContext, useResourceDefinition } from 'react-admin';

import { FieldDefinition } from '../hooks/useFieldForOperation';
import { useFieldsForOperation } from '../hooks/useFieldsForOperation';


export interface EditGuesserProps<RecordType extends RaRecord = any>
    extends Omit<EditProps<RecordType>, 'children'> {
  toolbar?: ReactElement | false;
  updateFieldDefinitions?: FieldDefinition[];
}

const EditGuesser = (
{
  toolbar,
  updateFieldDefinitions,
  ...props
}: EditGuesserProps): ReactElement => {
  const { name, options } = useResourceDefinition(props)
  
  const record = useRecordContext(props)

  const fieldDefinitions = useFieldsForOperation(`partial_update_${name}`)
  const fields = useMemo(
    ()=> 
      fieldDefinitions.filter(fieldDefinition => !fieldDefinition.props.disabled ).map(
        fieldDefinition => {

          const update = updateFieldDefinitions?.find(def => def.props.source === fieldDefinition.props.source)
        
          return createElement(
            update?.component || fieldDefinition.component, 
            {
              ...fieldDefinition.props, 
              key: `${fieldDefinition.props.source}-${record?.id}`,
              record: record,
              ...update?.props
            }
          )
        })
    ,[fieldDefinitions, record]
  )

  return (
    <Edit
      queryOptions={{
        refetchOnReconnect: true,
      }}
      mutationOptions={{ meta: { type: options?.type }}}
      mutationMode='pessimistic'
      
      {...props}
    >
      <SimpleForm
        toolbar={toolbar}
        sanitizeEmptyValues
      >
        {fields}
      </SimpleForm>
    </Edit>
  )
}

export default EditGuesser