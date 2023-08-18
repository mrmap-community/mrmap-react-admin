import { type ReactNode, useContext, useEffect, useState } from 'react'
import { Filter, type FilterProps, useResourceContext } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import { HttpClientContext } from '../../context/HttpClientContext'
import inputGuesser from '../openapi/inputGuesser'

export interface FilterParameter {
  name: string
  isRequired: boolean
  inputComponent: ReactNode
}

export interface FilterGuesserProps extends FilterProps {
  orderMarker?: string
}

const FilterGuesser = ({
  orderMarker = 'order',
  ...props
}: FilterGuesserProps): ReactNode => {
  const [filtersParameters, setFiltersParameters] = useState<FilterParameter[]>(
    []
  )
  const resource = useResourceContext()
  const { client } = useContext(HttpClientContext)

  useEffect(() => {
    if (client !== undefined) {
      const operation = client.api.getOperation(`list_${resource}`)
      const parameters = operation?.parameters as OpenAPIV3.ParameterObject[]
      // TODO: what about global search parameter?
      setFiltersParameters(parameters?.filter((parameter) => parameter.name.includes('filter'))
        .map((filter) => {
          const splitted = filter.name.split('.')
          const fieldName = splitted[0]
          const lookup = splitted[1]
          const schema = filter.schema as OpenAPIV3.NonArraySchemaObject
          return {
            name: filter.name.replace('filter[', '').replace(']', ''),
            isRequired: filter.required ?? false,
            inputComponent: inputGuesser(fieldName, schema, filter.required ?? false)
          }
        }).filter((filter) => {
          return !filter.name.includes(orderMarker)
        })
      )
    }
  }, [client])

  if (filtersParameters?.length === 0) {
    return null
  }

  return (
    <Filter {...props}>
      {filtersParameters?.map((filterParam) => {
        return filterParam.inputComponent
      })}
    </Filter>
  )
}

export default FilterGuesser
