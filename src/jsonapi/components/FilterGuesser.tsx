import { useEffect, useState } from 'react'
import { Filter, useResourceContext } from 'react-admin'

import type {
  FilterGuesserProps,
  FilterParameter,
  IntrospectedFiterGuesserProps
} from '@api-platform/admin'
import { InputGuesser, Introspecter } from '@api-platform/admin'

import GeoJsonInput from '../../components/GeoJsonInput'

export const IntrospectedFilterGuesser = ({
  fields,
  readableFields,
  writableFields,
  schema,
  schemaAnalyzer,
  ...rest
}: IntrospectedFiterGuesserProps) => {
  const [filtersParameters, setFiltersParameters] = useState<FilterParameter[]>(
    []
  )

  useEffect(() => {
    if (schema) {
      schemaAnalyzer
        .getFiltersParametersFromSchema(schema)
        .then((parameters) => {
          setFiltersParameters(parameters)
        })
    }
  }, [schema, schemaAnalyzer])

  if (filtersParameters.length === 0) {
    return null
  }

  return (
    <Filter {...rest}>
      {filtersParameters.map((filterParam) => {
        const splitted = filterParam.name.split('.')
        const fieldName = splitted[0]
        const lookup = splitted[1]
        const field = fields.find(({ name }) => name === fieldName)

        if (field?.type === 'geojson') {
          return <GeoJsonInput
                    key={`${fieldName}${lookup}`}
                    source={fieldName}
                    label={lookup ? `${fieldName} ${lookup}` : undefined}
                    alwaysOn={filterParam.isRequired}
          />
        }

        return <InputGuesser
            key={`${fieldName}${lookup}`}
            source={fieldName}
            label={lookup ? `${fieldName} ${lookup}` : undefined}
            alwaysOn={filterParam.isRequired}
      />
      })}
    </Filter>
  )
}

const FilterGuesser = (props: FilterGuesserProps) => {
  const resource = useResourceContext(props)

  return (
    <Introspecter
      component={IntrospectedFilterGuesser}
      resource={resource}
      {...props}
    />
  )
}

export default FilterGuesser
