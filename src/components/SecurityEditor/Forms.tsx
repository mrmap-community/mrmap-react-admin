import { TextInput, useCreateContext, SimpleForm, CreateBase, useInput, type TextInputProps } from 'react-admin'
import { useEffect, type ReactNode, useState } from 'react'
import { useOwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase'
import SchemaAutocompleteArrayInput from '../../jsonapi/components/SchemaAutocompleteArrayInput'
import SchemaAutocompleteInput from '../../jsonapi/components/SchemaAutocompleteInput'

export const GeoJSONInput = ({
  source,
  ...rest
}: TextInputProps): ReactNode => {
  const { geoJSON, setGeoJSON } = useOwsContextBase()
  const { field: { onChange } } = useInput({ source })

  const [isOver, setIsOver] = useState(false)
  const [file, setFile] = useState<File>()

  // Define the event handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsOver(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsOver(false)

    const file = event.dataTransfer.files.item(0)
    const reader = new FileReader()

    reader.onloadend = () => {
      setGeoJSON(JSON.parse(reader.result))
    }

    reader.onerror = () => {
      console.error('There was an issue reading the file.')
    }

    reader.readAsText(file)

    return reader
  }

  useEffect(() => {
    onChange(JSON.stringify(geoJSON))
  }, [geoJSON])

  return (
    <TextInput
      source={source}
      onChange={onChange}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...rest}
    />
  )
}

export interface SecurityCreateFormProps {
  defaultValues?: any
}

export const SecurityCreateForm = ({ defaultValues }: SecurityCreateFormProps): ReactNode => {
  const { save } = useCreateContext()

  // allowedArea (geojson)
  // description (string 1:512)
  // allowedGroups M2M
  // securedService FK
  // operations
  // securedLayers M2M

  return (
    <SimpleForm onSubmit={save} defaultValues={defaultValues}>
      <GeoJSONInput
        source="allowedArea"
        helperText={'draw a geometry inside the map'}
        isRequired={true}

      />
      <TextInput source="description" />
      <SchemaAutocompleteArrayInput
        key={'operations'}
        source={'operations'}
        isRequired={true}
        reference={'WebMapServiceOperation'}
        sort={'operation'}
        helperText={'test jiji'}
      />
      <SchemaAutocompleteArrayInput
        hidden={true}
        key={'securedLayers'}
        source={'securedLayers'}
        isRequired={true}
        reference={'Layer'}
        sort={'id'}
      />
      <SchemaAutocompleteInput
        hidden={true}
        key={'securedService'}
        source={'securedService'}
        isRequired={true}
        reference={'WebMapService'}
        sort={'id'}
      />
    </SimpleForm>
  )
}

export interface SecurityCreateProps {
  defaultValues?: any
}

export const SecurityCreate = ({ defaultValues }: SecurityCreateProps): ReactNode => {
  return (
    <CreateBase resource="AllowedWebMapServiceOperation">
      <SecurityCreateForm defaultValues={defaultValues} />
    </CreateBase>
  )
}
