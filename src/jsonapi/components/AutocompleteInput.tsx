import { type ReactNode, useContext, useEffect, useState } from 'react'
import { AutocompleteInput, ReferenceInput, type ReferenceInputProps } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import HttpClientContext from '../../context/HttpClientContext'
import { getEncapsulatedSchema } from '../../openapi/parser'

const filterToQuery = (searchText: string): any => ({ search: `${searchText}` })

const SchemaAutocompleteInput = (
  props: ReferenceInputProps
): ReactNode => {
  const httpClient = useContext(HttpClientContext)
  const [optionText, setOptionText] = useState('id')

  useEffect(() => {
    httpClient
      .then((client) => client.api.getOperation(`list_${props.reference}`))
      .then((operation) => getEncapsulatedSchema(operation))
      .then((schema) => {
        const jsonApiPrimaryDataProperties = schema?.properties as Record<string, OpenAPIV3.NonArraySchemaObject>
        const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes.properties as OpenAPIV3.NonArraySchemaObject
        if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'stringRepresentation') != null) {
          setOptionText('stringRepresentation')
        } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'title') != null) {
          setOptionText('title')
        } else if (Object.entries(jsonApiResourceAttributes).find(([key, value]) => key === 'name') != null) {
          setOptionText('name')
        }
      })
      .catch(() => { })
      .finally(() => { })
  }, [httpClient])

  // stringRepresentation || title || name

  return (
    <ReferenceInput {...props}>
      <AutocompleteInput
        filterToQuery={filterToQuery}
        optionText={optionText}
      />
    </ReferenceInput>

  )
}

export default SchemaAutocompleteInput
