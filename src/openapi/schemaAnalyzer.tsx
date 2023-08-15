import type { FilterParameter } from '@api-platform/admin'
import { openApiSchemaAnalyzer } from '@api-platform/admin'
import type { Parameter, Resource } from '@api-platform/api-doc-parser'

const ORDER_MARKER = 'order'

/**
 * @param schema The schema of a resource
 *
 * @returns The name of the reference field
 */
const getFieldNameFromSchema = (schema: Resource): string => {
  if ((schema.fields == null) || !schema.fields[0]) {
    return ''
  }

  if (schema.fields.find((schemaField) => schemaField.name === 'id') != null) {
    return 'id'
  }

  return schema.fields[0].name
}

/**
 * @param schema The schema of a resource
 *
 * @returns The filter parameters
 */
export const resolveSchemaParameters = async (schema: Resource): Promise<Parameter[]> => {
  if ((schema.parameters == null) || (schema.getParameters == null)) {
    return await Promise.resolve([])
  }

  return (schema.parameters.length === 0)
    ? await schema.getParameters()
    : await Promise.resolve(schema.parameters)
}

/**
 * @param schema The schema of a resource
 *
 * @returns The filter parameters without the order ones
 */
export const getFiltersParametersFromSchema = async (
  schema: Resource
): Promise<FilterParameter[]> => {
  if (schema.fields == null) {
    return await Promise.resolve([])
  }

  const authorizedFields = schema.fields.map((field) => field.name)

  // TODO: what about global search parameter?
  return await resolveSchemaParameters(schema).then((parameters) => {
    const filters = parameters
      .map((filter) => {
        const filterName = filter.variable.replace('filter[', '').replace(']', '')

        if (filterName.includes('_filter_lookup_')) {
          const splitted = filterName.split('_filter_lookup_')
          const fieldName = splitted[0]
          const lookup = splitted[1]
          return {
            name: `${fieldName}_filter_lookup_${lookup}`,
            isRequired: filter.required
          }
        } else {
          return {
            name: filterName,
            isRequired: filter.required
          }
        }
      })
      .filter((filter) => {
        return !filter.name.includes(ORDER_MARKER)
      })
      .filter((filter) => {
        return authorizedFields.some((fieldName) => filter.name.includes(fieldName))
      })
    return filters
  })
}

const analyzer = openApiSchemaAnalyzer()

analyzer.getFieldNameFromSchema = getFieldNameFromSchema
analyzer.getFiltersParametersFromSchema = getFiltersParametersFromSchema

export default analyzer
