import { type ReactElement, useMemo } from 'react'
import { AutocompleteArrayInput, AutocompleteInput, ReferenceArrayInput, type ReferenceArrayInputProps, ReferenceInput, type ReferenceInputProps } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import useOperationSchema from '../hooks/useOperationSchema'

const filterToQuery = (searchText: string): any => ({ search: `${searchText}` })

const getOptionText = (schema: OpenAPIV3.NonArraySchemaObject): string => {
  let optionText = 'id'

  const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes?.properties as OpenAPIV3.NonArraySchemaObject
  // TODO: change the check to a simpler way
  if (jsonApiResourceAttributes !== undefined) {
    if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'stringRepresentation') != null) {
      optionText = 'stringRepresentation'
    } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'title') != null) {
      optionText = 'title'
    } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'name') != null) {
      optionText = 'name'
    }
  }

  return optionText
}

export const SchemaAutocompleteInput = (
  props: ReferenceInputProps
): ReactElement => {
  const { schema } = useOperationSchema(`list_${props.reference}`)
  const optionText = useMemo(() => (schema !== undefined) ? getOptionText(schema) : 'id', [schema])

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
  const { schema } = useOperationSchema(`list_${props.reference}`)
  const optionText = useMemo(() => (schema !== undefined) ? getOptionText(schema) : 'id', [schema])

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
