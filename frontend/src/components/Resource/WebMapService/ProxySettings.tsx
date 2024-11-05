
import { useState } from 'react';
import { useRecordContext } from 'react-admin';
import CreateGuesser from '../../../jsonapi/components/CreateGuesser';
import EditGuesser from '../../../jsonapi/components/EditGuesser';


const ProxySettings = () => {
  // this is the wms service record with all includes layers which are fetched in the parent component.
  const record = useRecordContext();

  const [rerender, setRerender] = useState<boolean>()
  console.log('record', record)

  if (record?.proxySetting === null || record?.proxySetting === undefined)
    return (
      <CreateGuesser
        resource='WebMapServiceProxySetting'
        defaultValues={{securedService: record}}
       // mutationOptions={{onSuccess: () => setRerender(true)}}
        redirect={false}
      />
    )
  return (
    <EditGuesser 
      resource='WebMapServiceProxySetting'
      id={record?.['proxySetting']?.id}
    /> 
  )
}


const ProxySettingsTab = () => {
  return <ProxySettings />          
}



export default ProxySettingsTab