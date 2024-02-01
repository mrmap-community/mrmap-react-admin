import { TextInput, useCreateContext, SimpleForm, CreateBase, useInput, type TextInputProps } from 'react-admin'
import { useEffect, type ReactNode } from 'react'
import { useMapViewerContext } from '../MapViewer/MapViewerContext'
import SchemaAutocompleteArrayInput from '../../jsonapi/components/SchemaAutocompleteArrayInput'
import SchemaAutocompleteInput from '../../jsonapi/components/SchemaAutocompleteInput'

export const GeoJSONInput = ({
  source,
  ...rest
}: TextInputProps): ReactNode => {
  const { geoJSON } = useMapViewerContext()
  const { field: { onChange } } = useInput({ source })

  useEffect(() => {
    onChange(JSON.stringify(geoJSON))
    console.log('geoJSON', geoJSON)
  }, [geoJSON])

  return (
        <TextInput source={source} onChange={onChange} />
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
            <GeoJSONInput source="allowedArea" />
            <TextInput source="description" />
            <SchemaAutocompleteArrayInput

                key={'operations'}
                source={'operations'}
                isRequired={true}
                reference={'WebMapServiceOperation'}
                sort={'operation'}
            // helperText={schema.description}
            />
            <SchemaAutocompleteArrayInput
                // hidden={true}
                key={'securedLayers'}
                source={'securedLayers'}
                isRequired={true}
                reference={'Layer'}
                sort={'id'}
            />
            <SchemaAutocompleteInput
                // hidden={true}
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
