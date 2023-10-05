/// <reference types="react" />
import { type LayerProps } from '@react-leaflet/core'
import { TileLayer, type WMSOptions, type WMSParams } from 'leaflet'
import NonTiledLayer { type NonTiledLayerOptions } from 'NonTiledLayer'

export interface WMSNonTiledLayerProps extends WMSOptions, NonTiledLayerOptions {
    params?: WMSParams
    url: string
}
export declare const WMSNonTiledLayer: import('react').ForwardRefExoticComponent<WMSNonTiledLayerProps & import('react').RefAttributes<NonTiledLayer.WMS>>
