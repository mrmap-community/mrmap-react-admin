import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Box } from '@mui/material';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper, { StepperOwnProps } from '@mui/material/Stepper';
import {
  sanitizeListRestProps
} from 'ra-core';
import { useCallback, useState } from 'react';
import { Button, DeleteButton, Identifier, ListActionsProps, RaRecord, SaveButton, Toolbar, TopToolbar, useCreatePath } from 'react-admin';
import { Link, useParams } from 'react-router-dom';
import CreateGuesser from '../../../../jsonapi/components/CreateGuesser';
import DataGridDemo from '../../../../jsonapi/components/EditableList';
import EditGuesser from '../../../../jsonapi/components/EditGuesser';
import SchemaAutocompleteInput from '../../../../jsonapi/components/SchemaAutocompleteInput';
import CreateDialog from '../../../Dialog/CreateDialog';
import CreateSuggestionDialog from '../../../Dialog/CreateSuggestionDialog';

const Steps = (
  {
    activeStep,
    ...rest
  }: StepperOwnProps
) => {
  return (
    <Stepper activeStep={activeStep} {...rest}>

      <Step key='settings'>
        <StepLabel>Settings</StepLabel>
      </Step>
      <Step key='get-capabilities-probes'>
        <StepLabel>Get Capabilities Probes</StepLabel>
      </Step>
      <Step key='get-map-probes'>
        <StepLabel>Get Map Probes</StepLabel>
      </Step>
    </Stepper>
  )
}


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
      <Steps
        activeStep={0}
      />
      {
        settingId === undefined ? 
        <CreateGuesser
          resource='WebMapServiceMonitoringSetting'
          redirect={redirect}
          updateFieldDefinitions={[
            {
              component: SchemaAutocompleteInput, 
              props: {source: 'crontab', create: <CreateSuggestionDialog resource='CrontabSchedule' isOpen={true} />}
            }
          ]}
        />: 
        <EditGuesser 
          resource='WebMapServiceMonitoringSetting'
          id={settingId}
          redirect={redirect}
          updateFieldDefinitions={[
            {
              component: SchemaAutocompleteInput, 
              props: {source: 'crontab', create: <CreateSuggestionDialog resource='CrontabSchedule' isOpen={true}/>}
            }
          ]}          toolbar={
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <SaveButton alwaysEnable/>
                <DeleteButton/>
            </Toolbar>
          }
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
      <DataGridDemo/>
      
      
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


