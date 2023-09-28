import { type ReactNode } from 'react'
import { type RaRecord, ShowBase, useResourceDefinition } from 'react-admin'

import { type TreeItemProps } from '@mui/x-tree-view'

import OgcTreeView from './OGCTreeView'

export interface ActivateButtonProps {
  record: RaRecord
  callback?: () => void
}

export interface OgcLayerItemProps extends Partial<TreeItemProps> {
  layer: RaRecord
  onUpdateSuccessed?: () => void
}

const WmsTreeView = (): ReactNode => {
  const { name } = useResourceDefinition()

  return (
    <ShowBase resource={name}>
      <OgcTreeView ><div></div></OgcTreeView>
    </ShowBase>
  )
}

export default WmsTreeView
