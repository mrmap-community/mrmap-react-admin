import {
  HttpError,
  useCreate,
  useDelete,
  useInfiniteGetList,
  useResourceContext,
  useUpdate
} from 'ra-core';
import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrayInput, Loading, RaRecord, RemoveItemButton, SimpleFormIterator, useSimpleFormIterator, useSimpleFormIteratorItem } from 'react-admin';
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { useFieldsForOperation } from '../hooks/useFieldsForOperation';


export const RemoveButton = () => {
  const { source } = useSimpleFormIterator();
  const resource = useResourceContext();

  if (resource === undefined) {
    throw new Error(
      `RemoveButton can't be used without ResourceContext`
  );
  }

  const { remove, index,  } = useSimpleFormIteratorItem();
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
  const resource = useResourceContext();

  const { getValues: getValuesParent, formState: formStateParent  } = useFormContext();
  
  const [targetValue, setTargetValue] = useState({id: getValuesParent('id')});
  const [simpleFormInteratorKey, setSimpleFormInteratorKey] = useState((Math.random() + 1).toString(36).substring(7));

  const { 
    data,
    total,
    isPending,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteGetList(
      reference,
      {
        pagination: { page: 1, perPage: 10 },
        meta: { relatedResource: { resource: resource, ...targetValue}},
      }
  );

  const methods = useForm();

  const { append: appendValue } = useFieldArray({
    control: methods.control, // control props comes from useForm (optional: if you are using FormProvider)
    name: source, // unique name for your Field Array
  });

  const { getValues, setError, setValue } = methods;

  const [ create, ] = useCreate();
  const [ update, ] = useUpdate();
  

  const fieldDefinitions = useFieldsForOperation(`create_${reference}`)

  if (fieldDefinitions.length > 0 && !fieldDefinitions.find(def => def.props.source === target)) {
    throw new Error(
        `Wrong configured ReferenceManyInput: ${target} is not a field of ${reference}`
    );
  }

  const onError = useCallback((index: number, error: unknown) => {
    const httpError = error as HttpError 
    Object.entries(httpError?.body?.errors).forEach(([key, value]) => {    
      setError(
        `${source}.${index}.${key}`,
        {message: value as string}
      )
    });

    setError(`${source}.root.serverError`, {message: 'huhu'})
    
  },[source])

  useEffect(()=>{
    if (Array.isArray(data?.pages) && data?.pages.length > 0) {
      
      data?.pages.forEach((page, pageIndex) => {
        page.data.forEach((record, index) => {
          //Object.entries(record).forEach(([key, value]) => {
          //  setValue(`${source}.${(pageIndex+1)*index}.${key}`, value)
          //})
          //updateValue((pageIndex+1) * index, record)
          const exists = getValues()[source].find((existing: RaRecord) => existing.id === record.id) !== undefined
          !exists && appendValue(record)
          //setValue(`${source}.${(pageIndex+1)*index}`, record)
        })
      })

      setSimpleFormInteratorKey((Math.random() + 1).toString(36).substring(7))
      console.log(data?.pages, getValues())

    }
  }, [data])

  useEffect(()=>{
    if (formStateParent.isSubmitSuccessful){
      
      setTargetValue({ id: getValuesParent('id') })

      setValue(source, getValues()[source].map((element: any) => {
        element[target] = {id: getValuesParent('id')}
        return element;
      }))
      const nestedValues = getValues()[source] as RaRecord[]
      
      methods.clearErrors()

      nestedValues.forEach((resource, index) => { 
        if (resource.id === undefined){
          console.log('call create', index)
          create(
            reference, 
            { data: resource }, 
            { onError: (error, variables, context) => onError(index, error)}
          )
        } else {
          update(
            reference, 
            { data: resource}, 
            { onError: (error, variables, context) => onError(index, error)}
          )
        }
      })
   }
  }, [formStateParent.isSubmitSuccessful])


  return (
    <FormProvider {...methods} >
      <ArrayInput
       source={source}
       resource={reference}
       key={simpleFormInteratorKey}
      >
        <SimpleFormIterator
          
          inline
          disableReordering
          removeButton={<RemoveButton/>}
          meta={{error: {'checkResponseDoesContain': 'huhu'}}}
          
          //append={append}
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