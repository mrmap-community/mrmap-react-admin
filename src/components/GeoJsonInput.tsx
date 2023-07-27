import { TextInput, TextInputProps, useResourceContext } from "react-admin";

const GeoJsonInput = (props: TextInputProps) => {

    
    const resource = useResourceContext(props);
  


    return (
      <TextInput
        {...props}
      />
    );
  };
  
  export default GeoJsonInput;