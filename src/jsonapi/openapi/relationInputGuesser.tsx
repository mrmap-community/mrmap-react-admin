import { type ReactNode } from 'react'
import { type RaRecord } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import SchemaAutocompleteInput from '../components/AutocompleteInput'

const relationInputGuesser = (name: string, schema: OpenAPIV3.NonArraySchemaObject, isRequired: boolean = false, record?: RaRecord): ReactNode => {
  const relationSchema = schema?.properties?.data as OpenAPIV3.NonArraySchemaObject
  const type = relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
  const resource = type?.enum?.[0]

  return <SchemaAutocompleteInput
    key={name}
    source={name}
    isRequired={isRequired}
    reference={resource}
  // disabled={schema.readOnly ?? false}
  // helperText={schema.description}
  />
}

export default relationInputGuesser
