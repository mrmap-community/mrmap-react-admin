import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { AutocompleteArrayInput, type AutocompleteArrayInputProps, AutocompleteInput, type AutocompleteInputProps, type Identifier, Loading, type RaRecord, useDataProvider, useGetList, useGetOne, useRecordContext } from 'react-admin'

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import { hasIncludedData } from '../utils'

export interface SchemaAutocompleteInputProps extends AutocompleteInputProps {
  reference: string
  source: string
}

/**
 * DataRequest Workflow:
 * 1. check if record has initial data
 * 2. IF there are initial data, look for completed relation data ({id: 1, stringRepresentation: keyword, keyword: dop40} for example) inside the RaRecord which was collected by the json:api `include` query parameter in any component before
 * 3. IF there is no completed data, collect the information from remote api
 * 4. Fetch available choices on input focus
 * 5. Merge available choices and completed initial data
 */
export const SchemaAutocompleteInput = (
  {
    reference,
    source,
    ...rest
  }: SchemaAutocompleteInputProps
): ReactElement => {
  const dataProvider = useDataProvider()

  // TODO: check query param by schema ...
  const [filter, setFilter] = useState({ search: '' })

  const [isLoadingInitial, setIsLoadingInitial] = useState(false)
  const [errorInitial, setErrorInitial] = useState()

  const [isLoadingChoices, setIsLoadingChoices] = useState(false)
  const [errorChoices, setErrorChoices] = useState()

  const record = useRecordContext()
  const [selectedChoice, setSelectedChoice] = useState<RaRecord | undefined>(record[source])
  const [fetchedChoices, setFetchedChoices] = useState<RaRecord[]>([])

  const optionText = useSchemaRecordRepresentation()

  useEffect(() => {
    if (selectedChoice !== undefined) {
      if (!hasIncludedData(selectedChoice) && !isLoadingInitial && errorInitial === undefined) {
        // collect completed relation data from remote api
        setIsLoadingInitial(true)
        dataProvider.getOne(reference, { id: selectedChoice.id })
          .then(({ data }) => {
            setSelectedChoice(data)
            setIsLoadingInitial(false)
          })
          .catch(error => {
            setErrorInitial(error)
            setIsLoadingInitial(false)
          })
      }
    }
  }, [selectedChoice])

  const fetchChoices = useCallback(() => {
    if (!isLoadingChoices) {
      setIsLoadingChoices(true)
      const params = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'id', order: 'DESC' },
        filter,
        undefined
      }
      dataProvider.getList(reference, params)
        .then(({ data }) => {
          setFetchedChoices(data)
          setIsLoadingChoices(false)
        })
        .catch(error => {
          setErrorChoices(error)
          setIsLoadingChoices(false)
        })
    }
  }, [filter])

  useEffect(() => { fetchChoices() }, [filter])

  const availableChoices = useMemo(() => {
    const choices = [...fetchedChoices]
    if (selectedChoice !== undefined && !choices.map(choice => choice.id).includes(selectedChoice.id)) {
      choices.push(selectedChoice)
    }
    return choices
  }, [selectedChoice, fetchedChoices])

  if (isLoadingInitial) {
    // cause AutocompleteInput component uses reference on the selectedChoice to prevent rerendering,
    // there will be no rerendering on completing the initial related data with the same id
    // so we return a loading instead of initializing the AutocompletInput with the uncompleted initial value
    return <Loading />
  }

  return (
    <AutocompleteInput
      name={source}
      source={source}
      parse={(value: RaRecord) => { return { id: value } }}
      format={(value: RaRecord) => value?.id}
      isLoading={isLoadingInitial || isLoadingChoices}
      optionText={optionText}
      choices={availableChoices}
      value={selectedChoice}
      setFilter={value => { setFilter({ search: value }) }}
      onChange={(id: Identifier) => {
        setSelectedChoice(availableChoices.find((choice: RaRecord) => choice.id === id))
      }}
      onOpen={() => { fetchChoices() }}
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
  const initial = useMemo<RaRecord[]>(() => record[source] ?? [], [record])

  const [selectedChoices, setSelectedChoices] = useState(initial)

  // TODO: if !isIncluded we need to fetch the data about the inital selection...
  const isIncluded = useMemo(() => initial !== undefined && initial.find(record => (hasIncludedData(record)) !== undefined), [initial])

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
