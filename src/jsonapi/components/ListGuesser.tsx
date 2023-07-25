import {ListGuesser as AdminListGuesser, ListGuesserProps } from '@api-platform/admin';
import FilterGuesser from './FilterGuesser';
import { ReactElement } from 'react';






const ListGuesser = ({
    ...props
}: ListGuesserProps): ReactElement =>  {


    return (
        <AdminListGuesser
            filters={<FilterGuesser/>}
            {...props}
        >

        </AdminListGuesser>
    )

};


export default ListGuesser;