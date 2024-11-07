import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useCallback, useState } from 'react';
import { DeleteButton, Edit, Form, RaRecord, RecordRepresentation, SaveButton, useNotify, useTranslate } from 'react-admin';
import ListGuesser from '../../../jsonapi/components/ListGuesser';
import AllowedWebMapServiceOperationFields from '../AllowedWebMapServiceOperation/AllowedWebMapServiceOperationFields';


const AllowedWebMapServiceOperationOverview = () => {
  
  const translate = useTranslate();
  const notify = useNotify();

  const [clickedRow, setClickedRow] = useState<RaRecord>()
  const onEditSuccess = useCallback(()=>{
    setClickedRow(undefined)
    notify(`resources.AllowedWebMapServiceOperation.notifications.updated`, {
      type: 'info',
      messageArgs: {
          smart_count: 1,
          _: translate('ra.notification.updated', {
              smart_count: 1,
          })
      },
      undoable: false,
  });
  },[])

  const onDeleteSuccess = useCallback(()=>{
    setClickedRow(undefined)
    notify(`resources.AllowedWebMapServiceOperation.notifications.deleted`, {
      type: 'info',
      messageArgs: {
          smart_count: 1,
          _: translate('ra.notification.deleted', {
              smart_count: 1,
          })
      },
      undoable: false,
  });
  },[])

  return (
    <>
      <ListGuesser 
        resource='AllowedWebMapServiceOperation'
        rowActions={<></>}
        onRowClick={(record) => setClickedRow(record)}
      />
      {
      // only render Edit if clickedRow is defined. Otherwise the Edit compononent will get the id from the url path, which causes in wron id of wrong resources.
      clickedRow ?
      /* Edit and Form component needed to be outside the Dialog component. 
        Otherwise the scroll feature is broken.
        See: https://github.com/mui/material-ui/issues/13253 
      */
      <Edit
        mutationMode='pessimistic'
        resource="AllowedWebMapServiceOperation"
        id={clickedRow?.id}
        record={clickedRow}
        redirect={false}
        mutationOptions={{onSuccess: onEditSuccess}}
        sx={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Form>
          <Dialog 
            open={!!clickedRow}
            onClose={()=>setClickedRow(undefined)}
            scroll={'paper'}
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
          >
            <DialogTitle id="scroll-dialog-title">
              <RecordRepresentation record={clickedRow}/>
            </DialogTitle>

            <DialogContent 
              dividers={true} 
              id="scroll-dialog-description"
            >
              <AllowedWebMapServiceOperationFields />  
            </DialogContent>

            <DialogActions style={{ justifyContent: "space-between" }}>
                  <SaveButton onClick={()=>console.log('huhu')} mutationOptions={{onSuccess: onEditSuccess}}/>
                  <DeleteButton redirect={false} mutationOptions={{onSuccess: onDeleteSuccess}}/>
            </DialogActions>
          
          </Dialog>
        </Form>
      </Edit>
    : null} 
    </>
  )
}


export const SpatialSecureTab = () => {
  return (
    <AllowedWebMapServiceOperationOverview />          
  )
}



export default SpatialSecureTab