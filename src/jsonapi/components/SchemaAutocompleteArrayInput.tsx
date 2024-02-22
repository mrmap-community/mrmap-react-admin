import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { AutocompleteArrayInput, type AutocompleteArrayInputProps, type Identifier, Loading, type RaRecord, useDataProvider, useRecordContext, useResourceDefinition } from 'react-admin'

import useGetRelatedOperationSchemas from '../hooks/useGetRelatedOperationSchemas'
import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation'
import { hasIncludedData } from '../utils'
import CreateResourceDialog from './CreateResourceDialog'

export interface SchemaAutocompleteArrayInputProps extends AutocompleteArrayInputProps {
  reference: string
  source: string
  sort?: string
}

const SchemaAutocompleteArrayInput = (
  {
    reference,
    source,
    sort,
    ...rest
  }: SchemaAutocompleteArrayInputProps
): ReactElement => {
  const dataProvider = useDataProvider()

  // TODO: check query param by schema ...
  const [filter, setFilter] = useState({ search: '' })

  const [isLoadingInitial, setIsLoadingInitial] = useState(false)
  const [errorInitial, setErrorInitial] = useState()

  const [isLoadingChoices, setIsLoadingChoices] = useState(false)

  // TODO: show errors
  const [errorChoices, setErrorChoices] = useState()// eslint-disable-line

  const record = useRecordContext()
  const { name } = useResourceDefinition()

  const [selectedChoices, setSelectedChoices] = useState<RaRecord[]>((record === undefined) ? [] : record[source] ?? [])
  const [fetchedChoices, setFetchedChoices] = useState<RaRecord[]>([])

  const optionText = useSchemaRecordRepresentation()

  const { operations: relatedOperation } = useGetRelatedOperationSchemas(name, reference)

  useEffect(() => {
    if (selectedChoices !== undefined) {
      if (selectedChoices.some(choice => !hasIncludedData(choice)) && !isLoadingInitial && errorInitial === undefined) {
        // collect completed relation data from remote api
        setIsLoadingInitial(true)
        // TODO: check schema where we can get the related data the most effective way
        if (relatedOperation !== undefined) {
          const params = {
            pagination: { page: 1, perPage: 500 },
            sort: { field: sort ?? 'id', order: 'DESC' },
            filter: undefined,
            meta: { relatedResource: reference }
          }
          dataProvider.getList(name, params)
            .then(({ data }) => {
              if (data.length > 0) { setSelectedChoices(data) }
              setIsLoadingInitial(false)
            })
            .catch(error => {
              setErrorInitial(error)
              setIsLoadingInitial(false)
            })
        } else {
          console.warn(`your api does not provide a nested route for nested '${reference}' of '${name}'. We use the potential slower list endpoint with specific id filter instead.`)
          // fallback if nested resource list is not propagated by the api
          // TODO: check if the filter is available on this endpoint...
          const params = {
            pagination: { page: 1, perPage: 25 },
            sort: { field: sort ?? 'id', order: 'DESC' },
            filter: { 'filter[id.in]': selectedChoices?.map(choice => choice.id).join(',') }
          }
          dataProvider.getList(reference, params)
            .then(({ data }) => {
              if (data.length > 0) { setSelectedChoices(data) }
              setIsLoadingInitial(false)
            })
            .catch(error => {
              setErrorInitial(error)
              setIsLoadingInitial(false)
            })
        }
      }
    }
  }, [selectedChoices])

  const fetchChoices = useCallback(() => {
    if (!isLoadingChoices) {
      setIsLoadingChoices(true)
      const params = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: sort ?? 'id', order: 'DESC' },
        filter
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
    const choicesIds = choices.map(choice => choice.id)

    selectedChoices?.forEach((choice) => {
      if (!choicesIds?.includes(choice.id)) {
        choices.push(choice)
      }
    })

    return choices
  }, [selectedChoices, fetchedChoices])

  const onCreateSuccess = useCallback((data: RaRecord) => {
    setSelectedChoices([...selectedChoices, data])
  }, [])

  if (isLoadingInitial) {
    // cause AutocompleteInput component uses reference on the selectedChoice to prevent rerendering,
    // there will be no rerendering on completing the initial related data with the same id
    // so we return a loading instead of initializing the AutocompletInput with the uncompleted initial value
    return <Loading />
  }

  return (
    <AutocompleteArrayInput
      name={source}
      source={source}
      parse={(value: RaRecord) => value?.map((v: Identifier) => ({ id: v }))}
      format={(value: RaRecord) => value?.map((v: RaRecord) => v.id)}
      isLoading={isLoadingInitial || isLoadingChoices}
      optionText={optionText}
      choices={availableChoices}
      value={selectedChoices}
      setFilter={value => { setFilter({ search: value }) }}
      onChange={(ids: Identifier[]) => {
        const newSelections = ids.map((id) => availableChoices.find((choice: RaRecord) => choice.id === id)) as RaRecord[]
        setSelectedChoices(newSelections)
      }}
      create={<CreateResourceDialog creatProps={{ resource: reference, mutationOptions: { onSuccess: onCreateSuccess } }} dialogProps={{ open: true }} />}
      {...rest}
    />

  )
}

export default SchemaAutocompleteArrayInput
