import { type ReactElement } from 'react'
import { type RaRecord } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import { SchemaAutocompleteArrayInput, SchemaAutocompleteInput } from './AutocompleteInput'

const RelationInputGuesser = (name: string, schema: OpenAPIV3.NonArraySchemaObject, isRequired: boolean = false, record?: RaRecord): ReactElement => {
  const relationSchema = schema?.properties?.data as OpenAPIV3.SchemaObject

  if (relationSchema.type === 'array') {
    const _relationSchema = relationSchema.items as OpenAPIV3.NonArraySchemaObject
    const type = _relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
    const resource = type?.enum?.[0]

    return <SchemaAutocompleteArrayInput
      key={name}
      source={name}
      isRequired={isRequired}
      reference={resource}
      disabled={schema.readOnly ?? false}
      helperText={schema.description}
    />
  } else {
    const type = relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
    const resource = type?.enum?.[0]
    return <SchemaAutocompleteInput
      key={name}
      source={name}
      isRequired={isRequired}
      reference={resource}
      record={record}
      disabled={schema.readOnly ?? false}
      helperText={schema.description}
    />
  }
}

export default RelationInputGuesser
