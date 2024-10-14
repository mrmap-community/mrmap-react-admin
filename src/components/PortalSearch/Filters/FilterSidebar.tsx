import { FilterList, FilterListItem, SavedQueriesList } from 'react-admin';

import CategoryIcon from '@mui/icons-material/LocalOffer';
import MailIcon from '@mui/icons-material/MailOutline';
import { Card, CardContent } from '@mui/material';


export const FilterSidebar = () => (
  <Card sx={{ order: -1, mr: 2, mt: 9, width: 200 }}>
      <CardContent>
          {/* <FilterLiveSearch source={'search'} /> */}
          <SavedQueriesList />
          <FilterList label="Subscribed to newsletter" icon={<MailIcon />}>
              <FilterListItem label="Yes" value={{ has_newsletter: true }} />
              <FilterListItem label="No" value={{ has_newsletter: false }} />
          </FilterList>
          <FilterList label="Category" icon={<CategoryIcon />}>
              <FilterListItem label="Tests" value={{ category: 'tests' }} />
              <FilterListItem label="News" value={{ category: 'news' }} />
              <FilterListItem label="Deals" value={{ category: 'deals' }} />
              <FilterListItem label="Tutorials" value={{ category: 'tutorials' }} />
          </FilterList>
      </CardContent>
  </Card>
);

export default FilterSidebar
