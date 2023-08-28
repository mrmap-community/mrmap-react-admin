import { type ReactElement } from 'react'
import { AutocompleteArrayInput, AutocompleteInput, ReferenceArrayInput, type ReferenceArrayInputProps, ReferenceInput, type ReferenceInputProps } from 'react-admin'

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'

const filterToQuery = (searchText: string): any => ({ search: `${searchText}` })

export const SchemaAutocompleteInput = (
  props: ReferenceInputProps
): ReactElement => {
  const optionText = useSchemaRecordRepresentation()

  return (
    <ReferenceInput {...props}>
      <AutocompleteInput
        filterToQuery={filterToQuery}
        optionText={optionText}
        isRequired={props.isRequired}
        disabled={props.disabled}
      />
    </ReferenceInput>

  )
}

export const SchemaAutocompleteArrayInput = (
  props: ReferenceArrayInputProps
): ReactElement => {
  const optionText = useSchemaRecordRepresentation()

  return (
    <ReferenceArrayInput {...props}>
      <AutocompleteArrayInput
        filterToQuery={filterToQuery}
        optionText={optionText}
        isRequired={props.isRequired}
        disabled={props.disabled}

      />
    </ReferenceArrayInput>

  )
}
