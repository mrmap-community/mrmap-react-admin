import { type ReactNode } from 'react'
import { type RaRecord } from 'react-admin'

import { type TreeItemProps } from '@mui/x-tree-view'

import OgcTreeView from './OGCTreeView'
import { TreeBase } from './TreeContext'

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
    <TreeBase>
      <OgcTreeView ><div></div></OgcTreeView>
    </TreeBase>
  )
}

export default WmsTreeView
