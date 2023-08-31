import { type ReactElement, useState } from 'react'
import { useCreateSuggestionContext } from 'react-admin'

import {
  Dialog
} from '@mui/material'

import { CreateGuesser } from './FormGuesser'

interface CreateResourceDialogProps {
  resource: string
}

const CreateResourceDialog = (
  {
    resource
  }: CreateResourceDialogProps
): ReactElement => {
  const responseRef = useRef()
  const { filter, onCancel, onCreate } = useCreateSuggestionContext()
  const [value, setValue] = useState(filter ?? '')

  const handleSubmit = event => {
    event.preventDefault()
    const newOption = { id: value, name: value }
    // choices.push(newOption)
    setValue('')
    onCreate(newOption)
  }

  return (
    <Dialog open onClose={onCancel}>
      <CreateGuesser

        resource={resource}
      />

    </Dialog>
  )
}

export default CreateResourceDialog
