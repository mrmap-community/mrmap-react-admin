import { type ReactElement, useEffect, useMemo, useState } from 'react'
import { AutocompleteArrayInput, type AutocompleteArrayInputProps, AutocompleteInput, type AutocompleteInputProps, type Identifier, type RaRecord, ReferenceArrayInput, type ReferenceArrayInputProps, ReferenceInput, type ReferenceInputProps, useGetList, useRecordContext } from 'react-admin'

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import { hasIncludedData } from '../utils'

export interface SchemaAutocompleteInputProps extends AutocompleteInputProps {
  reference: string
  source: string
}

export const SchemaAutocompleteInput = (
  {
    reference,
    source,
    ...rest
  }: SchemaAutocompleteInputProps
): ReactElement => {
  // TODO: check query param by schema ...
  const [filter, setFilter] = useState({ search: '' })
  // TODO: handle json:api field errors
  const { data: fetchedChoices, isLoading, error } = useGetList(reference, { filter })

  const record = useRecordContext()

  const optionText = useSchemaRecordRepresentation()
  const initial = useMemo(() => record[source] ?? undefined, [record])
  const [selectedChoice, setSelectedChoice] = useState(initial)
  const isIncluded = useMemo(() => initial !== undefined && hasIncludedData(initial), [initial])

  // TODO: if !isIncluded we need to fetch the data about the inital selection...

  // TODO: remove duplicates of fetched choices and current selections
  const availableChoices = useMemo(() => (fetchedChoices != null)
    ? [selectedChoice ?? {}, ...fetchedChoices]
    : [], [selectedChoice, fetchedChoices])

  useEffect(() => {
    if (initial !== undefined) {
      setSelectedChoice(initial)
    }
  }, [initial])

  console.log('availableChoices', availableChoices, isIncluded)

  return (
    <AutocompleteInput
      name={source}
      source={source}
      parse={(value: RaRecord) => { return { id: value } }}
      format={(value: RaRecord) => value?.id}
      isLoading={isLoading}
      optionText={optionText}
      choices={availableChoices}
      setFilter={value => { setFilter({ search: value }) }}
      onChange={(id: Identifier) => {
        console.log('id', id)
        setSelectedChoice(availableChoices.find((choice: RaRecord) => choice.id === id))
      }}
      {...rest}
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
  // TODO: check query param by schema ...
  const [filter, setFilter] = useState({ search: '' })
  // TODO: handle json:api field errors
  const { data: fetchedChoices, isLoading, error } = useGetList(reference, { filter })

  const record = useRecordContext()

  const optionText = useSchemaRecordRepresentation()
  const initial = useMemo(() => record[source] ?? [], [record])
  const [selectedChoices, setSelectedChoices] = useState(initial)

  // TODO: remove duplicates of fetched choices and current selections
  const availableChoices = useMemo(() => (fetchedChoices != null)
    ? [...selectedChoices, ...fetchedChoices]
    : initial, [selectedChoices, fetchedChoices])

  useEffect(() => {
    if (initial !== undefined) {
      setSelectedChoices(initial)
    }
  }, [initial])

  return (
    <AutocompleteArrayInput
      name={source}
      source={source}
      parse={(value: RaRecord) => value?.map((v: Identifier) => ({ id: v }))}
      format={(value: RaRecord) => value?.map((v: RaRecord) => v.id)}
      isLoading={isLoading}
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
