import { type ReactNode } from 'react'
import { BooleanInput, DateInput, DateTimeInput, NumberInput, type RaRecord, TextInput, TimeInput } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import GeoJsonInput from '../../components/GeoJsonInput'

const inputGuesser = (name: string, schema: OpenAPIV3.NonArraySchemaObject, isRequired: boolean = false, record?: RaRecord): ReactNode => {
  // See https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#name-defined-formats for valid schema.format strings
  const commonProps = {
    key: name,
    source: name,
    label: schema.title ?? name,
    required: isRequired,
    disabled: schema.readOnly ?? false,
    helperText: schema.description,
    record
  }
  if (['integer', 'number'].includes(schema.type ?? '')) {
    return <NumberInput {...commonProps} />
  } else if (schema.type === 'boolean') {
    return <BooleanInput {...commonProps} />
  } else if (schema.type === 'string') {
    // Time specific fields
    if (schema.format === 'date-time') {
      return <DateTimeInput {...commonProps} />
    } else if (schema.format === 'date') {
      return <DateInput {...commonProps} />
    } else if (schema.format === 'time') {
      return <TimeInput {...commonProps} />
    } else if (schema.format === 'duration') {
      // TODO: is there a durationinput?
      return <TextInput {...commonProps} />
    } else if (schema.format === 'geojson') {
      return <GeoJsonInput {...commonProps} />
    }
  }

  // default fallback
  return <TextInput {...commonProps} />
}

export default inputGuesser
