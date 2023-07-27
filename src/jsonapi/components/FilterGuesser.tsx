import { useEffect, useState } from 'react';
import { Filter, useResourceContext } from 'react-admin';

import {InputGuesser, Introspecter } from '@api-platform/admin';

import type {
  FilterGuesserProps,
  FilterParameter,
  IntrospectedFiterGuesserProps,
} from '@api-platform/admin';


export const IntrospectedFilterGuesser = ({
  fields,
  readableFields,
  writableFields,
  schema,
  schemaAnalyzer,
  ...rest
}: IntrospectedFiterGuesserProps) => {
  const [filtersParameters, setFiltersParameters] = useState<FilterParameter[]>(
    [],
  );

  useEffect(() => {
    if (schema) {
      schemaAnalyzer
        .getFiltersParametersFromSchema(schema)
        .then((parameters) => {
          console.log("parameters", parameters);
          setFiltersParameters(parameters);
        });
    }
  }, [schema, schemaAnalyzer]);

  if (!filtersParameters.length) {
    return null;
  }


  

  return (
    <Filter {...rest}>
      {filtersParameters.map((filterParam)=> {
        const splitted = filterParam.name.split(".")
        const fieldName = splitted[0];
        const lookup = splitted[1];
        const field = fields.find(({ name }) => name === fieldName);

        if (field?.name.includes("bbox")){
          const fieldType = schemaAnalyzer.getFieldType(field);
          console.log(fieldName, "fieldType", fieldType);
        }


        return <InputGuesser
            key={`${fieldName}${lookup}`}
            source={fieldName}
            label={lookup ? `${fieldName} ${lookup}`: undefined}
            alwaysOn={filterParam.isRequired}
      />
      
      
      })}
    </Filter>
  );
};

const FilterGuesser = (props: FilterGuesserProps) => {
  const resource = useResourceContext(props);

  return (
    <Introspecter
      component={IntrospectedFilterGuesser}
      resource={resource}
      {...props}
    />
  );
};

export default FilterGuesser;