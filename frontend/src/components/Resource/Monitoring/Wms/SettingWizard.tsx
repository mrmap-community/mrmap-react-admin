import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Box } from '@mui/material';
import {
  sanitizeListRestProps
} from 'ra-core';
import { createElement, useCallback, useState } from 'react';
import { ArrayInput, Button, DeleteButton, Identifier, ListActionsProps, RaRecord, SaveButton, SimpleFormIterator, Toolbar, TopToolbar, useCreatePath } from 'react-admin';
import { Link, useParams } from 'react-router-dom';
import CreateGuesser from '../../../../jsonapi/components/CreateGuesser';
import EditableDatagrid from '../../../../jsonapi/components/EditableList';
import EditGuesser from '../../../../jsonapi/components/EditGuesser';
import SchemaAutocompleteInput from '../../../../jsonapi/components/SchemaAutocompleteInput';
import { useFieldsForOperation } from '../../../../jsonapi/hooks/useFieldsForOperation';
import CreateDialog from '../../../Dialog/CreateDialog';


interface FormInteratorProps {
  parentResource: string
  source: string
  forEdit?: boolean
}

const FormInterator = (
  {
    parentResource,
    source,
    forEdit=true
  }: FormInteratorProps
) => {

  const fields = useFieldsForOperation(forEdit ? `partial_update_${parentResource}`: `create_${parentResource}`)
  return (
    <ArrayInput source={source}>
        <SimpleFormIterator inline>
            {fields.map((fieldDefinition, index) => createElement(fieldDefinition.component, {key: `${fieldDefinition.props.source}-${index}`, ...fieldDefinition.props}))}
        </SimpleFormIterator>
    </ArrayInput>
  )
}

interface ReferenceManyInputProps {
  reference: string
  target: string
}

export const ReferenceManyInput = (
  {
    reference,
    target,
    

  }: ReferenceManyInputProps
) => {

  const fields = useFieldsForOperation(`create_${reference}`)
  return (
    <ArrayInput source={`${reference}s`}>
      <SimpleFormIterator inline>
          {
            fields.map(fieldDefinition => createElement(fieldDefinition.component, fieldDefinition.props))
          }
      </SimpleFormIterator>
    </ArrayInput>
  )
};



export const SettingWizardStep1 = () => {
  
  const createPath = useCreatePath();
  // id of the WebMapServiceMonitoringSetting record
  const { id: settingId } = useParams()


  const redirect = useCallback((
      resource?: string,
      id?: Identifier,
      data?: Partial<RaRecord>,
      state?: object
    ) => `WebMapServiceMonitoringSetting/${id}/GetCapabilitiesProbes`  
  , [settingId])
  
  return (
    <Box sx={{ width: '100%' }}>
      {
        settingId === undefined ? 
        <CreateGuesser
          resource='WebMapServiceMonitoringSetting'
          redirect={redirect}
          referenceInputs={[<ReferenceManyInput key='getCapabilitiesProbes' reference='GetCapabilitiesProbe' target='service'/>]}

        />: 
        <EditGuesser 
          resource='WebMapServiceMonitoringSetting'
          id={settingId}
          redirect={redirect}      
          toolbar={
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <SaveButton alwaysEnable/>
                <DeleteButton/>
            </Toolbar>
          }
          referenceInputs={[<ReferenceManyInput key='getCapabilitiesProbes' reference='GetCapabilitiesProbe' target='service'/>]}
        />
      }
    </Box>
  )
}


export const CustomTopToolbar = (
  {...props}: ListActionsProps
) => {
  const { className, filters: filtersProp, hasCreate: _, ...rest } = props;

  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}></TopToolbar>
  )
}

export const SettingWizardStep2 = () => {
  
  const createPath = useCreatePath();
  // id of the WebMapServiceMonitoringSetting record
  const { id: settingId } = useParams()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const redirect = useCallback((
    resource?: string,
    id?: Identifier,
    data?: Partial<RaRecord>,
    state?: object
  ) => `WebMapServiceMonitoringSetting/${id}/GetCapabilitiesProbes`  
, [settingId])
  
  return (
    <Box sx={{ width: '100%' }}>
      <Steps
        activeStep={1}
      />
      <EditableDatagrid resource='GetCapabilitiesProbe'/>
      
      
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          label='prev'
          component={Link}
          title='go to previous step'
          to={{pathname: `/WebMapServiceMonitoringSetting/${settingId}`, replace: true}}
          startIcon={<ArrowLeftIcon />}
          
        />
        <Button
          label='next'
          component={Link}
          title='go to next step'
          to={{pathname: `/WebMapServiceMonitoringSetting/${settingId}/GetMapProbes` , replace: true}}
          endIcon={<ArrowRightIcon />}
        />
  
      </Box>
      <CreateDialog
        resource={'GetCapabilitiesProbe'}
        isOpen={createDialogOpen}
        setIsOpen={setCreateDialogOpen}
        record={{setting: {id: settingId , type: "WebMapServiceMonitoringSetting"}}}
        updateFieldDefinitions={[
            {
              component: SchemaAutocompleteInput, 
              props: {source: 'setting', hidden: true}
            }
          ]}   
      />


    </Box>
  )
}


