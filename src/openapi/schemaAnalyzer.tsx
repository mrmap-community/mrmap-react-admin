import type { Resource } from '@api-platform/api-doc-parser';
import type { FilterParameter } from '@api-platform/admin'
import { SchemaAnalyzer } from "@api-platform/admin";
import {openApiSchemaAnalyzer} from "@api-platform/admin";

const ORDER_MARKER = "order"

/**
 * @param schema The schema of a resource
 *
 * @returns The name of the reference field
 */
const getFieldNameFromSchema = (schema: Resource) => {
  console.log("fieldnamelookup",schema);
  if (!schema.fields || !schema.fields[0]) {
    return '';
  }

  if (schema.fields.find((schemaField) => schemaField.name === 'id')) {
    return 'id';
  }

  return schema.fields[0].name;
};


/**
 * @param schema The schema of a resource
 *
 * @returns The filter parameters
 */
export const resolveSchemaParameters = (schema: Resource) => {
    if (!schema.parameters || !schema.getParameters) {
      console.log("möp", schema);
      return Promise.resolve([]);
    }
  
    return !schema.parameters.length
      ? schema.getParameters()
      : Promise.resolve(schema.parameters);
  };


/**
 * @param schema The schema of a resource
 *
 * @returns The filter parameters without the order ones
 */
export const getFiltersParametersFromSchema = (
    schema: Resource,
  ): Promise<FilterParameter[]> => {
    if (!schema.fields) {
      return Promise.resolve([]);
    }
  
    const authorizedFields = schema.fields.map((field) => field.name);

    // TODO: what about global search parameter?
    return resolveSchemaParameters(schema).then((parameters) => {
    
      const filters = parameters
        .map((filter) => {
          const filterName = filter.variable.replace("filter[", "").replace("]", "")
          return {
            name: filterName,
            isRequired: filter.required,
          }
        })
        .filter((filter) => {
          return !filter.name.includes(ORDER_MARKER) 
        })
        .filter((filter) => {
          return authorizedFields.some((fieldName) => filter.name.includes(fieldName))
        })
      return filters


      });
  };
  
  
const analyzer = {...openApiSchemaAnalyzer()};
analyzer.getFieldNameFromSchema = getFieldNameFromSchema;
analyzer.getFiltersParametersFromSchema = getFiltersParametersFromSchema;

export default analyzer