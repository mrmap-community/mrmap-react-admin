import { JsonApiPrimaryData, ResourceLinkage } from "./types/jsonapi";



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


export const encapsulateJsonApiPrimaryData = (data: JsonApiPrimaryData): any => {
    /** helper to transform json:api primary data object to react admin record
     * 
     */

    // const relationships = data.relationships ?? {}

    
    // for (const [relationName, relationship] of Object.entries(relationships)){
    //     console.log(`${relationName}: ${relationship}`);
    // }


    return {
        // TODO: how to handle relationships?
        id: data.id,
        ...data.attributes
    }
}