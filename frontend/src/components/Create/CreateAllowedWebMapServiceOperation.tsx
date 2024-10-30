import { createElement, useMemo } from 'react';
import { Create, CreateProps, SimpleForm, useResourceContext } from 'react-admin';
import { useWatch } from "react-hook-form";
import { useFieldsForOperation } from '../../jsonapi/hooks/useFieldsForOperation';
import TreeSelectInput from '../Input/TreeSelectInput';

const CreateAllowedWebMapServiceOperationFields = () => {
  const resource = useResourceContext()
  const securedServiceValue = useWatch({name: 'securedService'})
  const fieldDefinitions = useFieldsForOperation(`create_${resource}`)

  // Dynamic change depending fields
  const customFieldDefinitions = useMemo(()=>(
    fieldDefinitions
    .filter(def => def.props.disabled === false)
    .map(def => {
      if (def.props.source === 'securedLayers' && securedServiceValue && securedServiceValue?.id !== '') {
        const newDef = {...def}
        newDef.component = TreeSelectInput
        newDef.props.wmsId = securedServiceValue?.id
        delete newDef.props['reference'] 
        console.log('newDef', newDef)

        return newDef
      }
      return def
    })
  ),[fieldDefinitions, securedServiceValue])
  
  return customFieldDefinitions.map(fieldDefinitions => createElement(fieldDefinitions.component, fieldDefinitions.props))
} 

const CreateAllowedWebMapServiceOperation = ({
  ...rest
}: CreateProps) => {

    
  
    return (
      <Create

        {...rest}
      >
        <SimpleForm>
          <CreateAllowedWebMapServiceOperationFields/>
        </SimpleForm>
      </Create>
    )
};


export default CreateAllowedWebMapServiceOperation;