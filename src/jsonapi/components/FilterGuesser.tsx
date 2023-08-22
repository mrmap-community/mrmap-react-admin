import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Filter, type FilterProps, useResourceContext } from 'react-admin'

import { type OpenAPIV3 } from 'openapi-client-axios'

import useOperationSchema from '../hooks/useOperationSchema'
import inputGuesser from '../openapi/inputGuesser'

export interface FilterGuesserProps extends FilterProps {
  orderMarker?: string
}

const FilterGuesser = ({
  orderMarker = 'order',
  ...props
}: FilterGuesserProps): ReactNode => {
  const resource = useResourceContext()

  const [operationId, setOperationId] = useState('')
  const { operation } = useOperationSchema(operationId)

  const filtersParameters = useMemo(() => {
    const parameters = operation?.parameters as OpenAPIV3.ParameterObject[]
    // TODO: what about global search parameter?
    return parameters?.filter((parameter) => parameter.name.includes('filter'))
      .filter((filter) => !filter.name.includes(orderMarker))
      .map((filter) => {
        const schema = filter.schema as OpenAPIV3.NonArraySchemaObject
        return inputGuesser(filter.name.replace('filter[', '').replace(']', '').replace('.', '_filter_lookup_'), schema, filter.required ?? false)
      })
  }, [operation])

  useEffect(() => {
    if (resource !== undefined) {
      setOperationId(`list_${resource}`)
    }
  }, [resource])

  if (filtersParameters?.length === 0) {
    return null
  }

  return (
    <Filter {...props}>
      {...filtersParameters}
    </Filter>
  )
}

export default FilterGuesser
