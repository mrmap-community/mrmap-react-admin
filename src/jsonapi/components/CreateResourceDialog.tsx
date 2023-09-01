import { type ReactElement } from 'react'
import { type CreateProps, useCreateSuggestionContext } from 'react-admin'

import {
  Dialog,
  type DialogProps
} from '@mui/material'

import { CreateGuesser } from './FormGuesser'

export interface CreateResourceDialogProps {
  dialogProps: DialogProps
  creatProps: CreateProps
}

const CreateResourceDialog = (
  {
    dialogProps,
    creatProps
  }: CreateResourceDialogProps
): ReactElement => {
  const { onCancel } = useCreateSuggestionContext()

  return (
    <Dialog onClose={onCancel} {...dialogProps}>
      <CreateGuesser
        {...creatProps}
      />
    </Dialog>
  )
}

export default CreateResourceDialog
