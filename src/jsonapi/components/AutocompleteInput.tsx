import { type ReactNode, useContext, useEffect, useState } from 'react'
import { AutocompleteArrayInput, AutocompleteInput, ReferenceArrayInput, type ReferenceArrayInputProps, ReferenceInput, type ReferenceInputProps } from 'react-admin'

import { type OpenAPIClient, type OpenAPIV3, type UnknownOperationMethods, type UnknownPathsDictionary } from 'openapi-client-axios'

import { HttpClientContext } from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../../openapi/parser'

const filterToQuery = (searchText: string): any => ({ search: `${searchText}` })

const getOptionText = (httpClient: OpenAPIClient<UnknownOperationMethods, UnknownPathsDictionary>, reference: string): string => {
  let optionText = 'id'

  const operation = httpClient.api.getOperation(`list_${reference}`)
  const schema = getEncapsulatedSchema(operation)

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
): ReactNode => {
  const { client } = useContext(HttpClientContext)
  const [optionText, setOptionText] = useState('id')

  useEffect(() => {
    if (client !== null && client !== undefined) {
      const _getOptionText = async (): Promise<void> => {
        setOptionText(getOptionText(client, props.reference))
      }
      _getOptionText().catch(console.error)
    }
  }, [client])

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
): ReactNode => {
  const { client } = useContext(HttpClientContext)
  const [optionText, setOptionText] = useState('id')

  useEffect(() => {
    if (client !== null && client !== undefined) {
      const _getOptionText = async (): Promise<void> => {
        const _optionText = getOptionText(client, props.reference)
        setOptionText(_optionText)
      }
      _getOptionText().catch(console.error)
    }
  }, [client])

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
