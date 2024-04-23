import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { ReactNode } from 'react';
import { useMapViewerContext } from '../MapViewerContext';


export interface InitialFromOwsContextDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
}


const InitialFromOwsContextDialog = ({open, setOpen}: InitialFromOwsContextDialogProps): ReactNode => {
  const { initialFromOwsContext } = useMapViewerContext() 

  return (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData as any).entries());
            const getCapabilitiesUrl = formJson.getCapabilitiesUrl;
            initialFromOwsContext(getCapabilitiesUrl)
            setOpen(false)
          },
        }}
      >
        <DialogTitle>Initial</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To add a Web Map Service to the current OWS Context, please enter a valid GetCapabilitiesUrl.
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="getCapabilitiesUrl"
            name="getCapabilitiesUrl"
            label="Get Capabilities Url"
            type="url"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button type="submit" color='primary'>Add</Button>
        </DialogActions>
      </Dialog>
  );
}

export default InitialFromOwsContextDialog