import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { AutocompleteArrayInput, AutocompleteInput, type AutocompleteInputProps, type RaRecord, useGetList } from 'react-admin';
import { useFormContext } from 'react-hook-form';

import useSchemaRecordRepresentation from '../hooks/useSchemaRecordRepresentation';
import CreateResourceDialog from './CreateResourceDialog';
export interface SchemaAutocompleteInputProps extends AutocompleteInputProps {
  reference: string
  source: string
  sort?: string
}

/**
 * DataRequest Workflow:
 * 1. check if record has initial data
 * 2. IF there are initial data, look for completed relation data ({id: 1, stringRepresentation: keyword, keyword: dop40} for example) inside the RaRecord which was collected by the json:api `include` query parameter in any component before
 * 3. IF there is no completed data, collect the information from remote api
 * 4. Fetch available choices on input focus
 * 5. Merge available choices and completed initial data
 */
const SchemaAutocompleteInput = (
  {
    reference,
    source,
    sort,
    multiple = false,
    ...rest
  }: SchemaAutocompleteInputProps
): ReactElement => {
  const { setValue , getValues } = useFormContext();
  // TODO: check query param by schema ...
  const [filter, setFilter] = useState({ search: '' })

  const optionText = useSchemaRecordRepresentation()
    
  const { data: fetchedChoices, isPending, refetch: refetchChoices } = useGetList(
    reference,
    {
      pagination: { page: 1, perPage: 10 },
      sort: { field: sort ?? 'id', order: 'DESC' },
      filter: filter,
    }
  )

  const onCreateSuccess = useCallback((data: RaRecord) => {
    setValue(source, [...getValues(source), data])
  }, [source, setValue, getValues])

  const props = useMemo(()=>{return {
      name: source,
      source: source,
      isLoading: isPending,
      optionText: optionText,
      choices: fetchedChoices,
      setFilter: (value: string) =>  setFilter({ search: value }),
      onOpen: () => refetchChoices,
      create: <CreateResourceDialog creatProps={{ resource: reference, mutationOptions: { onSuccess: onCreateSuccess } }} dialogProps={{ open: true }} />,
      multiple: multiple,
      ...rest
    }
  }, [source, isPending, optionText, fetchedChoices, refetchChoices, onCreateSuccess, multiple, rest])


  if (multiple){
    return <AutocompleteArrayInput

      {...props}
    />
  } else {
    return (
      <AutocompleteInput
        {...props}
      />
    )
  }
}

export default SchemaAutocompleteInput
