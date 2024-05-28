import { test } from 'vitest'

import { OWSContext, OWSResource } from "../core"
import { karteRpFeatures as testdata } from './data'

export interface OwsContextFixture {
  karteRp: OWSContext
}
let owsContext: OWSContext | undefined 

const getKarteRp = async({task}, use) => {
  owsContext = new OWSContext();
  const features: OWSResource[] = [];
  testdata.forEach(resource => features.push(new OWSResource(resource.properties, resource.id, resource.bbox, resource.geometry)));
  owsContext.features = features;
  owsContext.sortFeaturesByFolder();
  await use(owsContext);

  features.splice(0,features.length);
  owsContext = undefined; // teardown owsContext
}

export const owsContextTest = test.extend<OwsContextFixture>({
  karteRp: getKarteRp,
  
})