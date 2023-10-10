import { type ReactNode } from 'react'
import { type RaRecord } from 'react-admin'

import { type TreeItemProps } from '@mui/x-tree-view'

import OgcTreeView from './OGCTreeView'
import { WMSTreeBase } from './WMSTreeContext'

export interface ActivateButtonProps {
  record: RaRecord
  callback?: () => void
}

export interface OgcLayerItemProps extends Partial<TreeItemProps> {
  layer: RaRecord
  onUpdateSuccessed?: () => void
}

const WmsTreeView = (): ReactNode => {
  return (
    <WMSTreeBase>
      <OgcTreeView ><div></div></OgcTreeView>
    </WMSTreeBase>
  )
}

export default WmsTreeView
