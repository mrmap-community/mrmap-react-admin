import { useCallback, type ReactNode } from 'react';
import { Button, Identifier, Link, useRecordContext, useStore } from 'react-admin';

import AgricultureIcon from '@mui/icons-material/Agriculture';

import ListGuesser from '../../jsonapi/components/ListGuesser';


const HarvestButton = (): ReactNode => {
  const record = useRecordContext()
  const [wmsList, setWmsList] = useStore<Identifier[]>(`mrmap.mapviewer.append.wms`, [])

  const handleOnClick = useCallback(()=>{
    if (record !== undefined){
      const newWmsList = [...wmsList, record.id]
      setWmsList(newWmsList)
    }
  }, [wmsList, setWmsList])

  return (
    <Button
      component={Link}
      to={`/viewer`}
      color="primary"
      onClick={handleOnClick}
    >
      <AgricultureIcon />
    </Button>
  )
}

const CatalogueServiceList = (): ReactNode => {
  return (
    <ListGuesser
      resource='CatalogueService'
      additionalActions={<HarvestButton />}
    // aside={<TaskList />}
    />

  )
}

export default CatalogueServiceList
