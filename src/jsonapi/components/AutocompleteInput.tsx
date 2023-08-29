import { type ReactElement, useMemo, useState } from 'react'
import { AutocompleteArrayInput, AutocompleteInput, type RaRecord, ReferenceArrayInput, type ReferenceArrayInputProps, ReferenceInput, type ReferenceInputProps, useGetList, useGetOne, useRecordContext } from 'react-admin'

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import { hasIncludedData } from '../utils'

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
  const [filter, setFilter] = useState({ search: '' })
  console.log('props', props)

  const optionText = useSchemaRecordRepresentation()
  // const { data: choices, isLoading: isLoadingChoices } = useGetList(props.reference, { filter })
  const choices: RaRecord[] = []
  const record = useRecordContext(props.record)
  const references = useMemo(() => record[props.source] ?? undefined, [record])

  const isIncluded = useMemo(() => references !== undefined && hasIncludedData(references), [references])

  const choicesWithIncluded = (choices != null)
    ? [...references, ...choices?.filter((choice: RaRecord) => references.find((ref: RaRecord) => ref.id === choice.id))]
    : references
  console.log(isIncluded, references, choicesWithIncluded, choices)

  return (
    <AutocompleteArrayInput
      name={props.reference}
      source={props.source}
      // filterToQuery={filterToQuery}
      optionText={optionText}
      isRequired={props.isRequired}
      disabled={props.disabled}
      choices={choicesWithIncluded}
      onInputChange={e => { setFilter({ search: e.target.value }) }}
    />

  )
}
