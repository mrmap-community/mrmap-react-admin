import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AddResourceDialog from './AddResourceDialog'
import InitialFromOwsContextDialog from './InitialFromOwsContextDialog'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useState } from 'react';


export const OwsContextActionButtons = () => {
    const [openAddResourceDialog, setOpenAddResourceDialog] = useState(false)
    const handleOpenAddResourceDialog = () => setOpenAddResourceDialog(true)
  
    const [openInitialDialog, setOpenInitialDialog] = useState(false)
    const handleOpenInitialDialog = () => setOpenInitialDialog(true)
  
    return (
    <>
        <Box  sx={{ '& > :not(style)': { m: 1 } }}>
            
            <Tooltip title="Initial">
                <Fab color="primary" aria-label="add" size="small" onClick={handleOpenInitialDialog}>
                    <AutoFixHighIcon />
                </Fab>
            </Tooltip>
            <InitialFromOwsContextDialog open={openInitialDialog} setOpen={setOpenInitialDialog}/>
      
            <Tooltip title="Add Resource">
                <Fab color="primary" aria-label="add" size="small" onClick={handleOpenAddResourceDialog}>
                <AddIcon />
                </Fab>
            </Tooltip>
            <AddResourceDialog open={openAddResourceDialog} setOpen={setOpenAddResourceDialog}/>
      
            <Tooltip title="Edit OWS Context">
                <Fab color="secondary" aria-label="edit" size="small">
                <EditIcon />
                </Fab>
            </Tooltip>
            <Divider/>

        </Box>
        
    </>
    )
}