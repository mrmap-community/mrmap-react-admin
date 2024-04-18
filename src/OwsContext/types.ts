import { Feature, FeatureCollection, Geometry, BBox } from 'geojson'

export interface Link {
    href: string
    type?: string
    lang?: string // RFC-3066 code
    title?: string
    length?: number
    [name: string]: any // extension, any other
}

export interface PreviewLink extends Link {
    length: number
}

export interface OWSContextLinks {
    // "http://www.opengis.net/spec/owc-geojson/1.0/req/core"
    // Specification Reference (requirements class) identifying that this is an OWC Context document and its version
    profiles: string[]// Specification Reference (requirements class) identifying that this is an OWC Context document and its version
    via?: Link[]
   // [name: string]: Link 

}


export interface Operation {
    code: string
    method: string
    type?: string
    href: string
    request?: Content
    result?: Content
    [name: string]: any // extension, any other
}

export interface Content {
    type: string
    href?: string
    title?: string
    content?: string
    [name: string]: any // extension, any other
}

export interface StyleSet {
    name: string
    title: string
    abstract?: string
    default?: boolean
    legendURL?: string
    content?: Content
    [name: string]: any // extension, any other
}


export interface Offering {
    code: string
    operations?: Operation[]
    contents?: Content[]
    styles?: StyleSet[]
    [name: string]: any // extension, any other
}


export interface OWSResourceLinks {
    alternates?: Link
    previews?: PreviewLink
    data?: Link
    via?: Link[]
}

export interface Author {
    name: string
}

export interface CreatorApp {
    title?: string // could be mrmap-frontend
    uri?: string // http://mrmap
    version?: string // sem version 1.0.0
}

export interface CreatorDisplay {
    pixelWidth?: number // shall be positive integer number
    pixelHeight?: number // shall be positive integer number
    mmPerPixel?: number // shall be floating
    [name: string]: any // extension, any other
}

export interface Category {
    term: string
}

export interface OWSContextProperties {
    links?: OWSContextLinks
    lang: string // languag e code as RFC-3066
    title: string
    subtitle?: string
    updated: string // RFC-3339 date
    author?: Author
    publisher?: string
    generator?: CreatorApp
    display?: CreatorDisplay
    rights?: string
    categories?: Category[]    
    [name: string]: any // extension, any other
}

export interface OWSResourceProperties {
    abstract?: string
    updated: string // RFC-3339 date format
    authors?: Author[]
    publisher?: string
    rights?: string
    date?: string // iso-8601 format
    links?: OWSResourceLinks
    offering?: Offering[]
    active?: boolean // default is true
    categories?: Category[]   
    minscaledenominator?: number 
    maxscaledenominator?: number 
    folder?: string
    [name: string]: any // extension, any other
}

export interface OWSResource extends Omit<Feature, "geometry"> {
    title: string
    properties: OWSResourceProperties
    geometry?: Geometry
}


export interface TreeifiedOWSResource extends OWSResource{
    children: TreeifiedOWSResource[]
  }
  

export interface OWSContext extends Omit<FeatureCollection, "features"> {
    id: string // String type that SHALL contain a URI value
    properties: OWSContextProperties
    bbox?: BBox
    date?: string // iso-8601 date
    features: OWSResource[]
}

