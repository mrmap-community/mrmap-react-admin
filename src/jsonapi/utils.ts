import { OpenAPIV3, Operation } from "openapi-client-axios";
import { JsonApiDocument, JsonApiPrimaryData, ResourceIdentifierObject, ResourceLinkage } from "./types/jsonapi";
import { getEncapsulatedSchema } from "../openapi/parser";
import { Identifier } from "react-admin";



export const capsulateJsonApiPrimaryData = (data: any, type: string, operation: Operation): JsonApiPrimaryData => {
    /** helper to transform react admin data to json:api conform primary data object
     * 
     */
    const id = data.id;
    const attributes = data;
    delete attributes.id;
    
    const relationships: Record<string, ResourceLinkage> = {};

    const resourceSchema = getEncapsulatedSchema(operation)

    const jsonApiPrimaryDataProperties = resourceSchema?.properties as {[key: string]: OpenAPIV3.NonArraySchemaObject};
    const jsonApiResourceRelationships = jsonApiPrimaryDataProperties?.relationships?.properties as OpenAPIV3.NonArraySchemaObject;
    
    for (const [relationName, resourceLinkageSchema] of Object.entries( jsonApiResourceRelationships )){
        if (relationName in attributes){
            // need to capsulate data of relationship as well
            const relationData = attributes[relationName];
            const isList = resourceLinkageSchema.properties.data?.hasOwnProperty("items");
            const relationSchema = isList ? resourceLinkageSchema?.properties?.data?.items as OpenAPIV3.NonArraySchemaObject : resourceLinkageSchema.properties.data as OpenAPIV3.NonArraySchemaObject;
            const relationResourceType = relationSchema?.properties?.type as OpenAPIV3.NonArraySchemaObject;

            if (isList){
                const newData: ResourceIdentifierObject[] = []
                relationData.forEach((id: Identifier) => newData.push({id: id, type: relationResourceType?.enum?.[0]}))
                relationships[relationName] = {data: newData};
            } else {
                relationships[relationName] = {data: {id: id, type: relationResourceType?.enum?.[0]}};
            }
            delete attributes[relationName];
        }
    }

    const primaryData: JsonApiPrimaryData = {
          id: id,
          type: type,
          attributes: attributes,
          relationships: relationships
      };
    return primaryData;
};


export const findIncludedData = (document: JsonApiDocument, resourceIdentifierObject: ResourceIdentifierObject): JsonApiPrimaryData => {
    /**Searches for included object and returns it insted of the ResourceIdentifierObject */
    const founded =  document.included?.find((data: JsonApiPrimaryData ) => data.id === resourceIdentifierObject.id && data.type === resourceIdentifierObject.type ) 
    const return_val = founded ?? resourceIdentifierObject as JsonApiPrimaryData; 
    return return_val;
};
// concrete the return value; it should be `ApiPlatformAdminRecord`
export const encapsulateJsonApiPrimaryData = (document: JsonApiDocument, data: JsonApiPrimaryData): any => {
    /** helper to transform json:api primary data object to react admin record
     * 
     */

    const relationships: any = {}

    if ( data?.relationships) {
        for (const [relationName, resourceLinkage] of Object.entries( data.relationships )){
            if (Array.isArray(resourceLinkage.data)){

                const relatedObjects: any[] = [];
                resourceLinkage.data.forEach(resourceIdentifierObject => {
                    relatedObjects.push(  
                        encapsulateJsonApiPrimaryData(
                            document, 
                            findIncludedData(document, resourceIdentifierObject)
                        )
                    );
                });
                relationships[`${relationName}`] = relatedObjects;

            } else {        
                relationships[`${relationName}`] = resourceLinkage.data? encapsulateJsonApiPrimaryData(
                    document, 
                    findIncludedData(document, resourceLinkage.data as ResourceIdentifierObject)
                ) : undefined;
                
            }
        }
    }


    const raData = data? {
        id: data.id,
        ...data.attributes,
        ...relationships

    }: undefined;

    return raData 
}