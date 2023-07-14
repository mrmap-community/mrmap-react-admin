import { parseSwaggerDocumentation } from "@api-platform/api-doc-parser";

export function introspect(entrypoint: string) {
  return parseSwaggerDocumentation(entrypoint).then(({ api }) => {
    const { resources } = api;

    return {
      data: {
        ...api,
        resources: resources?.map((resource) => ({
          ...resource,
          fields: resource?.fields?.map((field) => ({
            ...field,
            embedded: null
          })),
          parameters: []
        }))
      },
      customRoutes: []
    };
  });
}
