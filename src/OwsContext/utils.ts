import { OWSContext } from "./types";

export const OWSContextDocument = (): OWSContext => {

    return {
        id: "huhu",
        type: "FeatureCollection",
        properties: {
            lang: "en",
            title: "this is my first collection",
            updated: new Date().toISOString()
        },
        features: [],
        
    }
}