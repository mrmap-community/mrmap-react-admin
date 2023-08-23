import { type ReactElement } from 'react'
import { Create, DateInput, required, SimpleForm, TextInput, useResourceDefinition } from 'react-admin'

export const ResourceCreate = (): ReactElement => {
  const def = useResourceDefinition()
  const jsonApiType = def.options?.type

  const onError = (error) => {
    // TODO: handle jsonapi errors
  }

  return (
    <Create
      mutationOptions={{ onError, meta: { type: jsonApiType } }}
    >
      <SimpleForm>
        <TextInput source="title" validate={[required()]} fullWidth />
        <TextInput source="teaser" multiline={true} label="Short description" />
        <DateInput label="Publication date" source="published_at" defaultValue={new Date()} />
      </SimpleForm>
    </Create>
  )
}
