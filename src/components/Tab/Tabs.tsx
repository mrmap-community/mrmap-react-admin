import { type ReactNode, type SyntheticEvent, useMemo, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { type TabListProps, useTabListContext } from './TabListContext'
import IconButton from '@mui/material/IconButton'
import CancelIcon from '@mui/icons-material/Cancel'

export interface TabsProps {
  defaultTabs?: TabListProps[]
}

export const Tabs = ({ defaultTabs }: TabsProps): ReactNode => {
  const { tabList, setTabList } = useTabListContext()
  const [init, setInit] = useState<boolean>(false)

  const handleChange = (event: SyntheticEvent, newValue: string): void => {
    setTabList({ ...tabList, activeTab: newValue })
  }

  const handleTabClose = (event, index: string): void => {
    event.stopPropagation()
    const newTabList = tabList
    if (newTabList.tabs.length > 1) {
      newTabList.tabs = newTabList.tabs.splice(parseInt(index), 1)
    } else {
      newTabList.tabs = []
    }
    setTabList(newTabList)
  }

  useEffect(() => {
    if (defaultTabs !== undefined && !init) {
      const newTabList = tabList
      newTabList.tabs.push(...defaultTabs)
      setTabList({ ...tabList, activeTab: String(newTabList.tabs.length - 1) })
      setInit(true)
    }
  }, [defaultTabs])

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
  }, [tabList, defaultTabs])

  const tabPanels = useMemo(() => {
    return tabList.tabs.map((tabDef, index): ReactNode => (
      <TabPanel key={index} {...tabDef.tabPanel} value={String(index)} />
    )
    )
  }, [tabList])

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
