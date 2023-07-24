import { OpenAPIV3 } from "openapi-types";

import OpenAPIClientAxios, { Operation as AxiosOperation } from "openapi-client-axios";
import  { Api, Operation, Resource, Parameter, Field, FieldType } from "@api-platform/api-doc-parser"
import inflection from "inflection";
import { required } from "react-admin";

export interface ParsedOpenApi3Documentation {
  api: Api;
  document: OpenAPIV3.Document;
}

const mergeResources = (resourceA: Resource, resourceB: Resource) => {
  resourceB.fields?.forEach((fieldB) => {
    if (!resourceA.fields?.some((fieldA) => fieldA.name === fieldB.name)) {
      resourceA.fields?.push(fieldB);
    }
  });
  resourceB.readableFields?.forEach((fieldB) => {
    if (
      !resourceA.readableFields?.some((fieldA) => fieldA.name === fieldB.name)
    ) {
      resourceA.readableFields?.push(fieldB);
    }
  });
  resourceB.writableFields?.forEach((fieldB) => {
    if (
      !resourceA.writableFields?.some((fieldA) => fieldA.name === fieldB.name)
    ) {
      resourceA.writableFields?.push(fieldB);
    }
  });
  resourceB.operations?.forEach((operationB) => {
    if (
      !resourceA.operations?.some((operationA => operationA.name === operationB.name))
    ) {
      resourceA.operations?.push(operationB)
    }
  });

  return resourceA;
};

const getType = (openApiType: string, format?: string): FieldType => {
  if (format) {
    switch (format) {
      case "int32":
      case "int64":
        return "integer";
      default:
        return inflection.camelize(format.replace("-", "_"), true);
    }
  }

  return openApiType;
};

const buildResourceFromOpenApiSchema = (schema: OpenAPIV3.SchemaObject, operation: AxiosOperation) => {

  const description = schema.description;
  const fieldNames: string[] = []
  const readableFields: Field[] = [];
  const writableFields: Field[] = [];
  const isList = schema?.properties?.data?.hasOwnProperty("items");

  const jsonApiPrimaryData = getEncapsulatedSchema(operation);
  const jsonApiPrimaryDataProperties = jsonApiPrimaryData?.properties as {[key: string]: OpenAPIV3.NonArraySchemaObject};
  
  const requiredFields = jsonApiPrimaryData?.required ?? [];

  const jsonApiResourceId = jsonApiPrimaryDataProperties?.id as {[key: string]: OpenAPIV3.NonArraySchemaObject};
  const jsonApiResourceAttributes = jsonApiPrimaryDataProperties?.attributes as OpenAPIV3.NonArraySchemaObject;
  const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships as OpenAPIV3.NonArraySchemaObject;
  
  const properties ={
    ...jsonApiResourceAttributes?.properties,

    //...jsonApiResourceRelationships?.properties // FIXME: encapsulate relations
  };
  
  if (jsonApiResourceId){
    properties["id"] = jsonApiResourceId;
  }

  const jsonApiResourceType = jsonApiPrimaryDataProperties?.type as OpenAPIV3.NonArraySchemaObject;
  const typeRef = jsonApiResourceType?.allOf as [OpenAPIV3.SchemaObject];
  const name = typeRef?.[0]?.enum?.[0] ?? jsonApiResourceType?.enum?.[0] ?? "";
  fieldNames.push(...Object.keys(properties ?? {}));

  const fields = fieldNames.map((fieldName) => {
    const property = properties[fieldName] as OpenAPIV3.SchemaObject;
    
    const type = getType(property.type || "string", property.format);
    
    const field = new Field(fieldName, {
      id: null,
      range: null,
      type,
      arrayType:
        type === "array" && "items" in property
          ? getType(
              (property.items as OpenAPIV3.SchemaObject).type || "string",
              (property.items as OpenAPIV3.SchemaObject).format
            )
          : null,
      enum: property.enum
        ? Object.fromEntries(
            // Object.values is used because the array is annotated: it contains the __meta symbol used by jsonref.
            Object.values<string | number>(property.enum).map((enumValue) => [
              typeof enumValue === "string"
                ? inflection.humanize(enumValue)
                : enumValue,
              enumValue,
            ])
          )
        : null,
      reference: null,
      embedded: null,
      nullable: property.nullable ?? false,
      required: !!requiredFields.find((value) => value === fieldName),
      description: property.description ?? "",
    });

    if (!property.writeOnly) {
      readableFields.push(field);
    }
    if (!property.readOnly) {
      writableFields.push(field);
    }
    

    return field;
  });

  const getOperationType = (operation: AxiosOperation) => {
    if (operation.method === "get" && isList) {
      return "list";
    } else if (operation.method === "get") {
      return "show";
    } else if (operation.method === "post") {
      return "create";
    } else if (operation.method === "delete") {
      return "delete";
    } else if (operation.method === "patch") {
      return "edit";
    } else {
      return "show";
    }
  }

  const operationType = getOperationType(operation);

  const operations = [
    new Operation(
      operation.summary ?? operation.operationId ?? operationType,
      operationType,
      {
        method: operation.method,
        deprecated: operation.deprecated
      })
  ]

  // TODO: add parameters
  const parameters: Parameter[] = []
  const parametersSchema = operation.parameters as OpenAPIV3.ParameterObject[]
  parametersSchema?.forEach((schema) => {
    
    if (schema.name.includes("sort")){
      // provide sort parameter as order[id], order[lastModifiedAt] and so on
      const sortFieldSchema = schema?.schema as OpenAPIV3.ArraySchemaObject;
      const sortFieldParams = sortFieldSchema.items as OpenAPIV3.NonArraySchemaObject
      sortFieldParams?.enum?.filter((sortableField) => !sortableField.includes("-")).forEach((sortableField) => 
      
      
      {
        parameters.push(
          new Parameter(
            `order[${sortableField}]`,
            null,
            schema.required?? false,
            `order by ${sortableField}`,
            schema.deprecated?? false,
          )
        )
      });
    } else if (schema.name.includes("filter")){
      parameters.push(
        new Parameter(
          schema.name,
          null,
          schema.required?? false,
          `filter by ${schema.description}`,
          schema.deprecated?? false,
        )
      )
    } else {
      parameters.push(
        new Parameter(
          schema.name,
          null,
          schema.required?? false,
          operation.description?? "",
          schema.deprecated?? false,
        )
      )
    }

  });

  return new Resource(name, "url", {
    id: null,
    title: name,
    description,
    fields,
    readableFields,
    writableFields,
    parameters: parameters,
    getParameters: () => Promise.resolve([]),
    operations: operations
  });

};


export const getResourceSchema = (operation: AxiosOperation): OpenAPIV3.SchemaObject | undefined => {
  if (operation.method === "get") {
    const responseObject = operation?.responses?.['200'] as OpenAPIV3.ResponseObject;
    return responseObject?.content?.['application/vnd.api+json']?.schema as OpenAPIV3.SchemaObject;
  } else if (operation.method === "put" || "post") {
    const requestObject = operation?.requestBody as OpenAPIV3.RequestBodyObject;
    return requestObject?.content?.['application/vnd.api+json']?.schema as OpenAPIV3.SchemaObject;
  }
};

export const getEncapsulatedSchema = (operation: AxiosOperation): OpenAPIV3.NonArraySchemaObject => {
  /** helper function to return the encapsulated openapi schema of the jsonapi resource
   * 
   */
  const schema = getResourceSchema(operation);
  const isList = schema?.properties?.data?.hasOwnProperty("items");

  const jsonApiPrimaryDataList = schema?.properties?.data as OpenAPIV3.ArraySchemaObject;
  return isList ? jsonApiPrimaryDataList?.items as OpenAPIV3.NonArraySchemaObject : schema?.properties?.data as OpenAPIV3.NonArraySchemaObject;
};

export const collectJsonApiResourcesFromOpenApi3Documentation = (
    docEntrypoint: string
  ): Promise<ParsedOpenApi3Documentation> => {

  const axiosClient = new OpenAPIClientAxios({ definition: docEntrypoint });

  return axiosClient.init()
    .then((client) => client.api.getOperations())
    .then((operations) => {
      const resources: Resource[] = []
      
      operations.forEach((operation) => {
        
        if (operation?.operationId?.includes("_related_")) return; // nested resources urls represents not a full resource

        const schema = getResourceSchema(operation);
        if (!schema) return;

        const resource = buildResourceFromOpenApiSchema(schema, operation);
        if (!resource) return;


        const existingResource = resources.find(collectedResource => collectedResource.name == resource.name)
        if (existingResource) {
          // FIXME: how to handle different model forms?
          const mergedResource = mergeResources(existingResource, resource)
          resources[resources.indexOf(existingResource)] = mergedResource;
        } else {
          resources.push(resource);

        }

      });
      return resources;
    })
    .then((resources) => {
      return {
        api: new Api(docEntrypoint, {title: axiosClient.document.info.title, resources: resources}),
        document: axiosClient.document as OpenAPIV3.Document,
      }
    })
  }
  



export default collectJsonApiResourcesFromOpenApi3Documentation;