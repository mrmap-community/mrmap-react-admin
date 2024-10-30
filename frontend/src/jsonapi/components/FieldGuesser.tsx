import { type ReactElement } from 'react'
import { BooleanField, DateField, EmailField, NumberField, ReferenceOneField, UrlField } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import GeoJsonInput from '../../components/Input/GeoJsonInput'
import { ReferenceManyCount } from './ReferenceManyCount'
import TruncatedTextField from './TruncatedTextField'

const FieldGuesser = (name: string, schema: OpenAPIV3.NonArraySchemaObject, isSortable: boolean = true, currentResource: string): ReactElement => {
  // See https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01#name-defined-formats for valid schema.format strings

  const commonProps = {
    source: name,
    label: schema?.title ?? name,
    sortable: isSortable
  }

  if (['integer', 'number'].includes(schema?.type ?? '')) {
    return <NumberField key={name} {...commonProps} />
  } else if (schema?.type === 'boolean') {
    return <BooleanField key={name} {...commonProps} />
  } else if (schema?.type === 'string') {
    // Time specific fields
    if (['date', 'time', 'duration', 'date-time'].includes(schema?.format ?? '')) {
      return <DateField key={name} {...commonProps} showTime={['time', 'date-time'].includes(schema?.format ?? '')} />
    } else if (schema?.format === 'uri') {
      return <UrlField key={name} {...commonProps} />
    } else if (schema?.format === 'email') {
      return <EmailField key={name} {...commonProps} />
    } else if (schema?.format === 'geojson') {
      return <GeoJsonInput key={name} {...commonProps} />
    }
  } else if (schema?.type === 'object') {
    const primaryDataSchema = schema?.properties?.data as OpenAPIV3.SchemaObject
    if (primaryDataSchema?.type === 'object') {
      // single related object
      const typeSchema = primaryDataSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
      // eslint-disable-next-line
      const related = typeSchema?.enum?.[0]
      // TODO: only use this, if the field is not includeable...
      return <ReferenceOneField key={name} {...commonProps} reference={related} target={name} />
    } else if (primaryDataSchema?.type === 'array') {
      // multiple related objects
      const arraySchema = primaryDataSchema?.items as OpenAPIV3.NonArraySchemaObject
      const typeSchema = arraySchema?.properties?.type as OpenAPIV3.NonArraySchemaObject
      const related = typeSchema?.enum?.[0]
      return <ReferenceManyCount key={name} {...commonProps} resource={currentResource} relatedType={related} source={name} />
    }
  }

  // default fallback
  return <TruncatedTextField key={name} {...commonProps} textOverflow={'ellipsis'}/>
}

export default FieldGuesser
