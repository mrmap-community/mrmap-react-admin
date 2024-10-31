import { CreateProps, Edit, SimpleForm } from 'react-admin';
import AllowedWebMapServiceOperationFields from './AllowedWebMapServiceOperationFields';


const EditAllowedWebMapServiceOperation = ({
  ...rest
}: CreateProps) => {
  
    return (
      <Edit
        mutationMode='pessimistic'
        {...rest}
      >
        <SimpleForm>
          <AllowedWebMapServiceOperationFields/>
        </SimpleForm>
      </Edit>
    )
};


export default EditAllowedWebMapServiceOperation;