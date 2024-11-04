import { createElement, type ReactElement, useMemo } from 'react';
import { Create, type CreateProps, SaveButton, SimpleForm, Toolbar, useResourceDefinition } from 'react-admin';

import { useFieldsForOperation } from '../hooks/useFieldsForOperation';


export const CreateToolbar = () => (
  // To support initialize all fields we need to set alwaysEnable to true
  // see https://github.com/marmelab/react-admin/issues/5796
  <Toolbar>
      <SaveButton alwaysEnable />
  </Toolbar>
);


const CreateGuesser = (
  {
    mutationOptions,
    ...rest
  }: CreateProps
): ReactElement => {

  const { name, options } = useResourceDefinition({ resource: rest.resource })

  const fieldDefinitions = useFieldsForOperation(`create_${name}`)
  const fields = useMemo(
    ()=> 
      fieldDefinitions.map(
        fieldDefinition => 
          createElement(
            fieldDefinition.component, 
            {
              ...fieldDefinition.props, 
              key: fieldDefinition.props.source,
            }
          )
        )
    ,[fieldDefinitions]
  )

  // be clear that json:api type is always part of mutationOptions so that the dataprovider has all information he needs
  const _mutationOptions = useMemo(() => {
    return (mutationOptions != null) ? { ...mutationOptions, meta: { type: options?.type } } : { meta: { type: options?.type } }
  }, [mutationOptions])


  return (
    <Create
      redirect="list" // default is edit... but this is not possible on async created resources
      mutationOptions={_mutationOptions}
      {...rest}
    >
      <SimpleForm
      toolbar={<CreateToolbar/>}>
        {fields}
      </SimpleForm>
    </Create>
  )
}


export default CreateGuesser