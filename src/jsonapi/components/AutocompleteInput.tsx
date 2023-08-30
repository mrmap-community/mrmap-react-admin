import { type ReactElement, useEffect, useMemo, useState } from 'react'
import { AutocompleteArrayInput, AutocompleteInput, type Identifier, type RaRecord, ReferenceArrayInput, type ReferenceArrayInputProps, ReferenceInput, type ReferenceInputProps, useGetList, useRecordContext } from 'react-admin'

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'

// TODO: check query param by schema ...
const filterToQuery = (searchText: string): any => ({ search: `${searchText}` })

export const SchemaAutocompleteInput = (
  props: ReferenceInputProps
): ReactElement => {
  const optionText = useSchemaRecordRepresentation()

  return (
    <AutocompleteInput
      name={props.reference}
      source={props.source}
      filterToQuery={filterToQuery}
      optionText={optionText}
      isRequired={props.isRequired}
      disabled={props.disabled}
    />
  )
}

export const SchemaAutocompleteArrayInput = (
  props: ReferenceArrayInputProps
): ReactElement => {
  const [filter, setFilter] = useState({ search: '' })
  const { data: fetchedChoices, isLoading, error } = useGetList(props.reference, { filter })

  const record = useRecordContext(props.record)

  const optionText = useSchemaRecordRepresentation()
  // const { data: choices, isLoading: isLoadingChoices } = useGetList(props.reference, { filter })
  const references = useMemo(() => record[props.source] ?? [], [record])
  const referenceIds = useMemo(() => references?.map((ref: RaRecord) => ref.id) ?? [], [references])
  const [selectedChoices, setSelectedChoices] = useState(references)

  // TODO: remove duplicates of fetched choices and current selections
  const availableChoices = (fetchedChoices != null)
    ? [...selectedChoices, ...fetchedChoices]
    : references

  useEffect(() => {
    if (references !== undefined) {
      setSelectedChoices(references)
    }
  }, [references])

  return (
    <AutocompleteArrayInput
      name={props.resource}
      source={props.source}
      parse={(value: RaRecord) => value?.map((v: Identifier) => ({ id: v }))}
      format={(value: RaRecord) => value?.map((v: RaRecord) => v.id)}
      isLoading={isLoading}
      // filterToQuery={filterToQuery}
      optionText={optionText}
      isRequired={props.isRequired}
      disabled={props.disabled}
      choices={availableChoices}
      setFilter={value => { setFilter({ search: value }) }}
      onChange={(ids: Identifier[]) => {
        const newSelections = ids.map((id) => availableChoices.find((choice: RaRecord) => choice.id === id))
        setSelectedChoices(newSelections)
      }}
    />

  )
}
