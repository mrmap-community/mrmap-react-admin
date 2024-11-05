import { Grid } from '@mui/material';
import { ReactNode } from 'react';

import { CreateButton, List, SimpleList, useRecordContext } from 'react-admin';

const CreateAllowedWebMapServiceOperation = (): ReactNode => {
  const record = useRecordContext()
  
  return (
    <CreateButton
      resource='AllowedWebMapServiceOperation'  
      state={{ record: { securedService: record, }}}
    />
  )
}

const AllowedWebMapServiceOperationOverview = () => {
  // this is the wms service record with all includes layers which are fetched in the parent component.
  const record = useRecordContext();
  return (
    <List
      resource='AllowedWebMapServiceOperation'
      queryOptions={{meta: {relatedResource: {resource: 'WebMapService', id: record?.id}}}}
      actions={<CreateAllowedWebMapServiceOperation/>}
    >
        <SimpleList
            primaryText={record => record.title}
            secondaryText={record => `${record.views} views`}
            tertiaryText={record => new Date(record.published_at).toLocaleDateString()}
            linkType={record => record.canEdit ? "edit" : "show"}
            rowSx={record => ({ backgroundColor: record.nb_views >= 500 ? '#efe' : 'white' })}
        />
    </List>
  )
}


export const SpatialSecureTab = () => {

    
  return (
      <Grid container spacing={2} sx={{ justifyContent: 'space-between' }} >
          <Grid item>
            
              <AllowedWebMapServiceOperationOverview />          
          </Grid>
         
      </Grid>
  )
}



export default SpatialSecureTab