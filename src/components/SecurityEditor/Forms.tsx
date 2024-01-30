import { TextInput, useCreateContext, SimpleForm, CreateBase, useInput, type TextInputProps } from 'react-admin'
import { useEffect, type ReactNode } from 'react'
import { useMapViewerContext } from '../MapViewer/MapViewerContext'
import SchemaAutocompleteArrayInput from '../../jsonapi/components/SchemaAutocompleteArrayInput'

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

export const SecurityCreateForm = (): ReactNode => {
    const { save } = useCreateContext()

    // allowedArea (geojson)
    // description (string 1:512)
    // allowedGroups M2M
    // securedService FK
    // operations
    // securedLayers M2M

    return (
        <SimpleForm onSubmit={save}>
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

        </SimpleForm>
    )
}

export const SecurityCreate = (): ReactNode => {
    console.log('huh1u')
    return (
        <CreateBase resource="AllowedWebMapServiceOperation">
            <SecurityCreateForm />
        </CreateBase>
    )
}
