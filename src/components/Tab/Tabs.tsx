import { type ReactNode, type SyntheticEvent, useMemo } from 'react'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { useTabListContext } from './TabListContext'
import IconButton from '@mui/material/IconButton'
import CancelIcon from '@mui/icons-material/Cancel'

export const Tabs = (): ReactNode => {
  const { tabList, setTabList } = useTabListContext()

  const handleChange = (event: SyntheticEvent, newValue: string): void => {
    setTabList({ ...tabList, activeTab: newValue })
  }

  const handleTabClose = (event, index: string): void => {
    event.stopPropagation()
    const newTabList = tabList
    console.log(newTabList.tabs.length, newTabList.tabs)
    if (newTabList.tabs.length > 1) {
      newTabList.tabs = newTabList.tabs.splice(parseInt(index), 1)
    } else {
      newTabList.tabs = []
    }
    setTabList(newTabList)
  }

  console.log(tabList)

  const tabs = useMemo(() => {
    return tabList.tabs.map((tabDef, index): ReactNode => (
      <Tab
        key={index}
        value={String(index)}
        {...tabDef.tab}
        icon={
          <IconButton onClick={(event) => { handleTabClose(event, index) }}>
            <CancelIcon />
          </IconButton>
        }
      />
    )
    )
  }, [tabList])

  const tabPanels = useMemo(() => {
    return tabList.tabs.map((tabDef, index): ReactNode => (
      <TabPanel key={index} {...tabDef.tabPanel} value={String(index)} />
    )
    )
  }, [tabList])

  const TabContextComponent = useMemo(() => {
    if (tabList.activeTab !== '') {
      return (
        <TabContext value={tabList.activeTab}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              {...tabs}
            </TabList>
          </Box>
          {...tabPanels}
        </TabContext>
      )
    } else {
      return <></>
    }
  }, [tabList, tabPanels, tabs])

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={tabList.activeTab === '' ? '0' : tabList.activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            {...tabs}
          </TabList>
        </Box>
        {...tabPanels}
      </TabContext>
    </Box>
  )
}
