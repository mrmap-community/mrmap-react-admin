import { createElement, type ReactElement, useMemo } from 'react';
import { Edit, type EditProps, RaRecord, SimpleForm, useRecordContext, useResourceDefinition } from 'react-admin';

import { useFieldsForOperation } from '../hooks/useFieldsForOperation';

export interface EditGuesserProps<RecordType extends RaRecord = any>
    extends Omit<EditProps<RecordType>, 'children'> {}

const EditGuesser = (
  props: EditGuesserProps
): ReactElement => {
  const { name, options } = useResourceDefinition(props)
  
  const record = useRecordContext(props)

  const fieldDefinitions = useFieldsForOperation(`partial_update_${name}`)

  const fields = useMemo(
    ()=> 
      fieldDefinitions.map(
        fieldDefinition => 
          createElement(
            fieldDefinition.component, 
            {
              ...fieldDefinition.props, 
              key: `${fieldDefinition.props.source}-${record?.id}`,
              record: record
            }
          )
        )
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
        
        sanitizeEmptyValues
      >
        {fields}
      </SimpleForm>
    </Edit>
  )
}

export default EditGuesser