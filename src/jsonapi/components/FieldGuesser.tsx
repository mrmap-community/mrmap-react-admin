import { type ReactElement } from 'react'
import { BooleanField, DateField, EmailField, NumberField, TextField, UrlField } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import GeoJsonInput from '../../components/GeoJsonInput'
import { ReferenceManyCount } from './ReferenceManyCount'

const FieldGuesser = (name: string, schema: OpenAPIV3.NonArraySchemaObject, isSortable: boolean = true): ReactElement => {
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
  } else if (schema?.type === 'object') {
    const primaryDataSchema = schema?.properties?.data as OpenAPIV3.SchemaObject
    if (primaryDataSchema?.type === 'object') {
      // single related object
      const typeSchema = primaryDataSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
      const related = typeSchema?.enum?.[0]
      // TODO
      // return <ReferenceOneField {...commonProps} reference={related} target={resource} />
    } else if (primaryDataSchema?.type === 'array') {
      // multiple related objects
      const arraySchema = primaryDataSchema?.items as OpenAPIV3.NonArraySchemaObject
      const typeSchema = arraySchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
      const related = typeSchema?.enum?.[0]
      return <ReferenceManyCount {...commonProps} reference={related} source={name} />
    }
  }

  // default fallback
  return <TextField {...commonProps} />
}

export default FieldGuesser
