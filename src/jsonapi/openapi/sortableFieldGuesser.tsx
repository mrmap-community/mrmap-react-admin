const parametersSchema = operation.parameters as OpenAPIV3.ParameterObject[]
parametersSchema?.forEach((schema) => {
  if (schema.name.includes('sort')) {
    // provide sort parameter as order[id], order[lastModifiedAt] and so on
    const sortFieldSchema = schema?.schema as OpenAPIV3.ArraySchemaObject
    const sortFieldParams = sortFieldSchema.items as OpenAPIV3.NonArraySchemaObject
    sortFieldParams?.enum?.filter((sortableField) => !sortableField.includes('-')).forEach((sortableField) => {
      parameters.push(
        new Parameter(
          `order[${sortableField}]`,
          null,
          schema.required ?? false,
          `order by ${sortableField}`,
          schema.deprecated ?? false
        )
      )
    })

    const sortableFieldGuesser = ()