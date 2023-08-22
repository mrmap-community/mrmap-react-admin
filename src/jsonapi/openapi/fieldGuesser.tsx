import { type ReactNode } from 'react'
import { BooleanField, DateField, EmailField, NumberField, TextField, UrlField } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import GeoJsonInput from '../../components/GeoJsonInput'

const fieldGuesser = (name: string, schema: OpenAPIV3.NonArraySchemaObject, isSortable: boolean = true): ReactNode => {
  // See https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#name-defined-formats for valid schema.format strings

  const commonProps = {
    key: name,
    source: name,
    label: schema?.title ?? name,
    sortable: isSortable
  }
  if (['integer', 'number'].includes(schema?.type ?? '')) {
    return <NumberField {...commonProps} />
  } else if (schema?.type === 'boolean') {
    return <BooleanField {...commonProps} />
  } else if (schema?.type === 'string') {
    // Time specific fields
    if (['date', 'time', 'duration', 'date-time'].includes(schema?.format ?? '')) {
      return <DateField {...commonProps} showTime={['time', 'date-time'].includes(schema?.format ?? '')} />
    } else if (schema?.format === 'uri') {
      return <UrlField {...commonProps} />
    } else if (schema?.format === 'email') {
      return <EmailField {...commonProps} />
    } else if (schema?.format === 'geojson') {
      return <GeoJsonInput {...commonProps} />
    }
  }

  // default fallback
  return <TextField {...commonProps} />
}

export default fieldGuesser
