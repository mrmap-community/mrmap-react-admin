import { type ReactElement } from 'react'
import { BooleanInput, DateInput, DateTimeInput, NumberInput, type RaRecord, TextInput, TimeInput } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import GeoJsonInput from '../../components/GeoJsonInput'

const inputGuesser = (name: string, schema: OpenAPIV3.NonArraySchemaObject, isRequired: boolean = false, record?: RaRecord): ReactElement => {
  // See https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#name-defined-formats for valid schema.format strings
  const commonProps = {
    source: name,
    label: schema.title ?? name,
    required: isRequired,
    disabled: schema.readOnly ?? false,
    helperText: schema.description,
    record
  }

  if (['integer', 'number'].includes(schema.type ?? '')) {
    return <NumberInput key={name} {...commonProps} />
  } else if (schema.type === 'boolean') {
    return <BooleanInput key={name} {...commonProps} defaultValue={schema.default ?? false} />
  } else if (schema.type === 'string') {
    // Time specific fields
    if (schema.format === 'date-time') {
      return <DateTimeInput key={name} {...commonProps} />
    } else if (schema.format === 'date') {
      return <DateInput key={name} {...commonProps} />
    } else if (schema.format === 'time') {
      return <TimeInput key={name} {...commonProps} />
    } else if (schema.format === 'duration') {
      // TODO: is there a durationinput?
      // https://mui.com/x/react-date-pickers/
      return <TextInput key={name} {...commonProps} />
    } else if (schema.format === 'geojson') {
      return <GeoJsonInput key={name} {...commonProps} />
    }
  }

  // default fallback
  return <TextInput key={name} {...commonProps} />
}

export default inputGuesser
