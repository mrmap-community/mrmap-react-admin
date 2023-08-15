import collectJsonApiResourcesFromOpenApi3Documentation from './openapi/parser'

export async function introspect (entrypoint: string) {
  return await collectJsonApiResourcesFromOpenApi3Documentation(entrypoint).then(({ api }) => {
    const { resources } = api

    return {
      data: {
        ...api,
        resources: resources?.map((resource) => ({
          ...resource,
          fields: resource?.fields?.map((field) => ({
            ...field,
            embedded: null
          }))
          // parameters: resource.parameters
        }))
      },
      customRoutes: []
    }
  })
}
