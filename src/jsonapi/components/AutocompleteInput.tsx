import { type ReactElement, useEffect, useMemo, useState } from 'react'
import { AutocompleteArrayInput, type AutocompleteArrayInputProps, AutocompleteInput, type Identifier, type RaRecord, ReferenceArrayInput, type ReferenceArrayInputProps, ReferenceInput, type ReferenceInputProps, useGetList, useRecordContext } from 'react-admin'

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

export interface SchemaAutocompleteArrayInputProps extends AutocompleteArrayInputProps {
  reference: string
  source: string
}

export const SchemaAutocompleteArrayInput = (
  {
    reference,
    source,
    ...rest
  }: SchemaAutocompleteArrayInputProps
): ReactElement => {
  const [filter, setFilter] = useState({ search: '' })
  const { data: fetchedChoices, isLoading, error } = useGetList(reference, { filter })

  const record = useRecordContext()

  const optionText = useSchemaRecordRepresentation()
  const references = useMemo(() => record[source] ?? [], [record])
  const [selectedChoices, setSelectedChoices] = useState(references)

  // TODO: remove duplicates of fetched choices and current selections
  const availableChoices = useMemo(() => (fetchedChoices != null)
    ? [...selectedChoices, ...fetchedChoices]
    : references, [selectedChoices, fetchedChoices])

  useEffect(() => {
    if (references !== undefined) {
      setSelectedChoices(references)
    }
  }, [references])

  return (
    <AutocompleteArrayInput
      name={source}
      source={source}
      parse={(value: RaRecord) => value?.map((v: Identifier) => ({ id: v }))}
      format={(value: RaRecord) => value?.map((v: RaRecord) => v.id)}
      isLoading={isLoading}
      // filterToQuery={filterToQuery}
      optionText={optionText}
      choices={availableChoices}
      setFilter={value => { setFilter({ search: value }) }}
      onChange={(ids: Identifier[]) => {
        const newSelections = ids.map((id) => availableChoices.find((choice: RaRecord) => choice.id === id))
        setSelectedChoices(newSelections)
      }}
      {...rest}
    />

  )
}
