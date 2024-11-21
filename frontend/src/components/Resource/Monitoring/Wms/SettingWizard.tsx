import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Box } from '@mui/material';
import {
  sanitizeListRestProps,
  useCreate,
  useDelete,
  useResourceContext,
  useUpdateMany
} from 'ra-core';
import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrayInput, Button, DeleteButton, Identifier, ListActionsProps, Loading, RaRecord, RemoveItemButton, SaveButton, SimpleFormIterator, Toolbar, TopToolbar, useCreatePath, useSimpleFormIterator, useSimpleFormIteratorItem } from 'react-admin';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import CreateGuesser from '../../../../jsonapi/components/CreateGuesser';
import EditableDatagrid from '../../../../jsonapi/components/EditableList';
import EditGuesser from '../../../../jsonapi/components/EditGuesser';
import SchemaAutocompleteInput from '../../../../jsonapi/components/SchemaAutocompleteInput';
import { useFieldsForOperation } from '../../../../jsonapi/hooks/useFieldsForOperation';
import CreateDialog from '../../../Dialog/CreateDialog';


export const RemoveButton = () => {
  const { source } = useSimpleFormIterator();
  const resource = useResourceContext();

  if (resource === undefined) {
    throw new Error(
      `RemoveButton can't be used without ResourceContext`
  );
  }

  const { remove, index } = useSimpleFormIteratorItem();
  const { getValues } = useFormContext();

  const [deleteOne, { isPending, error, isSuccess }] = useDelete();

  const onClick = useCallback(async ()=>{
    const record = getValues()[source][index]

    if (record.id !== undefined) {
      deleteOne(resource, { id: record.id, previousData: record});
    } else {
      remove();
    }
  },[remove, resource, getValues])

  useEffect(()=>{
    if (isSuccess) {
      // delete on serverside is done successfully
      remove()
    }
  }, [isSuccess])

  return (
    <RemoveItemButton 
      onClick={() => onClick()}
      disabled={isPending}
    >
      {isPending ? <Loading/>: <></>}
    </RemoveItemButton>
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
  const source = useMemo(()=> `${reference}s`, [reference])

  const { resetField, unregister, trigger, getValues, setError, control, handleSubmit, formState: {isSubmitSuccessful, isSubmitting, isSubmitted, }, getFieldState } = useFormContext();
  
  const methods = useForm();

  const [create, { isPending, error }] = useCreate();
  const [updateMany, { isPending: isUpdateManyPending, error: updateManyError }] = useUpdateMany();
  
  const fieldDefinitions = useFieldsForOperation(`create_${reference}`)

  if (fieldDefinitions.length > 0 && !fieldDefinitions.find(def => def.props.source === target)) {
    throw new Error(
        `Wrong configured ReferenceManyInput: ${target} is not a field of ${reference}`
    );
  }

  const [targetValue, setTargetValue] = useState({id: getValues('id')})

  useEffect(()=>{
    if (error){
      console.log('error:',error)
      setError(source, error)
    }
  },[error])


  useEffect(()=>{
    if (isSubmitSuccessful){
      
      setTargetValue({id: getValues('id')})

      methods.setValue(source, methods.getValues()[source].map((element: any) => {
        element[target] = {id: getValues('id')}
        return element;
      }))
      const nestedValues = methods.getValues()[source] as RaRecord[]
      const newResources = nestedValues.filter(value => value.id === undefined)
      const existingResources = nestedValues.filter(value => value.id !== undefined)

      newResources.forEach(resource => { 
        console.log('resource', resource)
        create(reference, { data: resource })        
      })

      if (existingResources.length > 0){
        updateMany(
          reference,
          { 
            ids: existingResources.map(resource => resource.id),
            data: {

            }
          }
        )
      }

      
      console.log('this nested form values:', methods.getValues())
    }
    
  }, [isSubmitSuccessful, isSubmitting, isSubmitted])


  return (
    <FormProvider {...methods} >
      <ArrayInput
       source={source}
       resource={reference}
      >
        <SimpleFormIterator
          inline
          disableReordering
          removeButton={<RemoveButton/>}
        >
            {
              fieldDefinitions.map(
                (fieldDefinition, index) => {
                  const props = {
                    key: `${reference}-${index}`,
                    ...fieldDefinition.props,
                  }
                  
                  if (fieldDefinition.props.source === target) {
                    props.hidden = true
                    props.defaultValue = targetValue
                  }

                  return createElement(
                    fieldDefinition.component, 
                    props
                  )
                }
                  
              )
            }
        </SimpleFormIterator>
      </ArrayInput>
    </FormProvider>
    
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
          referenceInputs={[<ReferenceManyInput key='getCapabilitiesProbes' reference='GetCapabilitiesProbe' target='setting'/>]}

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
          referenceInputs={[<ReferenceManyInput key='getCapabilitiesProbes' reference='GetCapabilitiesProbe' target='setting'/>]}
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


