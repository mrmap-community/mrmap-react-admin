import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren, type ReactNode } from 'react'

import { BBox, Point } from 'geojson'
import _ from 'lodash'

import { Position } from '../../ows-lib/OwsContext/enums'
import { CreatorDisplay, OWSContext, OWSResource, TreeifiedOWSResource } from '../../ows-lib/OwsContext/types'
import { OWSContextDocument, findNodeByFolder, getAncestors, getDescandants, getNextRootId, getOptimizedGetMapUrls, moveFeature as moveFeatureUtil, treeify, wmsToOWSResources } from '../../ows-lib/OwsContext/utils'
import { parseWms } from '../../ows-lib/XMLParser/parseCapabilities'

export interface OwsContextBaseType {
  // TODO: crs handling
  //crsIntersection: MrMapCRS[]
  //selectedCrs: MrMapCRS
  //setSelectedCrs: (crs: MrMapCRS) => void
  owsContext: OWSContext
  features: OWSResource[]
  addWMSByUrl: (url: string) => void
  initialFromOwsContext: (url: string) => void
  trees: TreeifiedOWSResource[]
  activeFeatures: OWSResource[]
  setFeatureActive: (folder: string, active: boolean) => void
  moveFeature: (source: OWSResource, target: OWSResource, position: Position) => void
}

export const context = createContext<OwsContextBaseType | undefined>(undefined)

export interface OwsContextBaseProps extends PropsWithChildren {
  initialFeatures?: OWSResource[] 
}

export const OwsContextBase = ({ initialFeatures = [], children }: OwsContextBaseProps): ReactNode => {

  // area of interest in crs 4326
  const [bbox, setBbox] = useState<BBox>([-180, -90, 180, 90])
  const [display, setDisplay] = useState<CreatorDisplay>({})
  const [features, setFeatures] = useState<OWSResource[]>(initialFeatures)
  
  const owsContext = useMemo(()=>{
    const doc = OWSContextDocument()
    
    return {
      ...doc,
      ...(bbox && {bbox: bbox}),
      ...(features && {features: bbox}),
      ...(display && {properties: {...doc.properties, display: display}})
    }
  }, [bbox, features])

  
  const trees = useMemo(() => {
    return treeify(features)
  }, [features])

  const atomicGetMapUrls = useMemo(()=>{
    return getOptimizedGetMapUrls(trees)
  }, [trees])

  const activeFeatures = useMemo(()=>{
    return features.filter(feature => feature.properties.active === true)
  }, [features])

 
  const addWMSByUrl = useCallback((url: string)=>{
    const request = new Request(url, {
      method: 'GET',
    })
    fetch(request).then(response => response.text()).then(xmlString => {
      
      const nextRootId = getNextRootId(features)
      
      const parsedWms = parseWms(xmlString)
      const additionalFeatures = wmsToOWSResources(parsedWms, nextRootId)

      setFeatures([...features, ...additionalFeatures])

    }      
  )
  }, [features])

  const initialFromOwsContext = useCallback((url: string)=>{
    const request = new Request(url, {
      method: 'GET',
    })
    fetch(request).then(response => response.json()).then((json: any) => {
      // todo: check type before setting features.
      // todo: set also other variables
      setFeatures(json.features)
      json.bbox && setBbox(json.bbox)
      // TODO: initial map with current display if exists  map?.fitBounds()
    }      
  )
  }, [])

  const setFeatureActive = useCallback((folder: string, active: boolean)=>{
    const feature = findNodeByFolder(features, folder)
    if (feature !== undefined){
      feature.properties.active = active
      // activate all descendants
      getDescandants(features, feature, true).forEach(descendant => descendant.properties.active = active)

      // deactivate parent to prevent from parend layer using for getmap calls etc.
      if (active === false) {
        getAncestors(features, feature).forEach(ancestor => ancestor.properties.active = active)
      }
      setFeatures([...features])
    }
  }, [features])

  const moveFeature = useCallback((source: OWSResource, target: OWSResource, position: Position = Position.lastChild) => {
    const newFeatures = moveFeatureUtil([...features], source, target, position)
    setFeatures(newFeatures)
  }, [features, setFeatures])

  const updateBbox = useCallback((newBbox: BBox) => {
    !_.isEqual(bbox, newBbox) && setBbox(newBbox)
  },[bbox])

  const updateDisplay = useCallback((size: Point) => {
    const newDisplay = {
      pixelWidth: size.coordinates[0],
      pixelHeight: size.coordinates[1]
    }
    !_.isEqual(display, newDisplay) && setDisplay(newDisplay)
  }, [display])

   // /** crs handling*/
  // const [selectedCrs, setSelectedCrs] = useState()

  // // intersection of all reference systems
  // const crsIntersection = useMemo(() => {
  //   // TODO: refactor this by using the crs from the ows context resources
  //   // let referenceSystems: MrMapCRS[] = []
  //   /* wmsTrees.map(wms => wms.rootNode?.record.referenceSystems.filter((crs: MrMapCRS) => crs.prefix === 'EPSG')).forEach((_referenceSystems: MrMapCRS[], index) => {
  //     if (index === 0) {
  //       referenceSystems = referenceSystems.concat(_referenceSystems)
  //     } else {
  //       referenceSystems = referenceSystems.filter(crsA => _referenceSystems.some(crsB => crsA.stringRepresentation === crsB.stringRepresentation))
  //     }
  //   }) */
  //   // return referenceSystems
  // }, [owsContext])

  // useEffect(() => {

  //   if (selectedCrs?.bbox !== undefined) {
  //     const bbox = JSON.parse(selectedCrs?.bbox)
  //     const bboxGeoJSON = L.geoJSON(bbox)
  //     const newMaxBounds = bboxGeoJSON.getBounds()
  //     setMaxBounds(newMaxBounds)
  //   }
  // }, [selectedCrs])

  // useEffect(() => {
  //   if (maxBounds !== undefined && map !== undefined) {
  //     const currentCenter = map.getCenter()
  //     map.setMaxBounds(maxBounds)
  //     if (maxBounds.contains(currentCenter)) {
  //       // do nothing... the current center is part of the maximum boundary of the crs system
  //     } else {
  //       // current center is not part of the boundary of the crs system. We need to center the map new
  //       map?.fitBounds(maxBounds)
  //     }

  //     // map?.setMaxBounds(maxBounds)
  //   }
  // }, [map, maxBounds])

  // useEffect(() => {
  //   if (crsIntersection.length > 0 && selectedCrs === undefined) {
  //     const defaultCrs = crsIntersection.find(crs => crs.stringRepresentation === 'EPSG:4326') ?? crsIntersection[0]
  //     setSelectedCrs(defaultCrs)
  //   }
  // }, [crsIntersection, selectedCrs])


  const value = useMemo<OwsContextBaseType>(() => {
    return {

      owsContext,
      features,
      addWMSByUrl,
      initialFromOwsContext,
      trees,
      activeFeatures,
      setFeatureActive,
      moveFeature
    }
  }, [

    owsContext,
    features,
    addWMSByUrl,
    initialFromOwsContext,
    trees,
    activeFeatures,
    setFeatureActive,
    moveFeature
  ])

  return (
    <context.Provider
      value={value}
    >
      {children}
    </context.Provider>
  )
}

export const useOwsContextBase = (): OwsContextBaseType => {
  const ctx = useContext(context)

  if (ctx === undefined) {
    throw new Error('useOwsContextBase must be inside a OwsContextBase')
  }
  return ctx
}
