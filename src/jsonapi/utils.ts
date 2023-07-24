import { JsonApiDocument, JsonApiPrimaryData, ResourceIdentifierObject } from "./types/jsonapi";



export const capsulateJsonApiPrimaryData = (data: any, type: string): JsonApiPrimaryData => {
    /** helper to transform react admin data to json:api conform primary data object
     * 
     */
    const id = data.id;
    const attributes = data;
    delete attributes.id;
    // TODO: how to handle relationships?
    const primaryData: JsonApiPrimaryData = {
          id: id,
          type: type,
          attributes: attributes
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