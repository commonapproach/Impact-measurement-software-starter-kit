import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import Dropdown from "./fields/MultiSelectField";
import {fetchOrganizations} from "../../api/organizationApi";
import {UserContext} from "../../context";


// const filterOptions = createFilterOptions({
//   ignoreAccents: false,
//   matchFrom: 'start'
// });


// function LoadingAutoComplete({label, options, property, state, onChange, disabled, error, helperText, required, onBlur}) {
//   return (
//     <Autocomplete
//       sx={{mt: 2}}
//       options={Object.keys(options[property])}
//       getOptionLabel={(key) => options[property][key]}
//       fullWidth
//       value={state[property]}
//       onChange={onChange(property)}
//       filterOptions={filterOptions}
//       renderInput={(params) =>
//         <TextField
//           {...params}
//           required={required}
//           label={label}
//           disabled={disabled}
//           error={error}
//           helperText={helperText}
//           onBlur={onBlur}
//         />
//       }
//     />
//   );
// }

export default function IndicatorField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization}) {

  const [state, setState] = useState(defaultValue || {});
  const [options, setOptions] = useState({})
  const userContext = useContext(UserContext);

  const [errors, setErrors] = useState({...importErrors});


  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  useEffect(() => {
    fetchOrganizations(userContext).then(({success, organizations}) => {
      if(success){
        const options ={} ;
        organizations.map(organization => options[organization._id] = organization.legalName)
        setOptions(options)
      }
    })
  }, [])

  const handleChange = name => (e, value) => {
    setState(state => {
      state[name] = value ?? e.target.value;
      return state;
    });
    // state[name] = value ?? e.target.value;
    onChange(state);
  };

  return (
    <Paper variant="outlined" sx={{mt: 3, mb: 3, p: 2.5, borderRadius: 2}}>
      {label? <Typography variant="h5">
        {label} {required ? '*' : ''}
      </Typography>: <div/>}
      {
        <>
          <Grid container columnSpacing={2}>
            <Grid item xs={5}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Name"
                type="text"
                defaultValue={state.name}
                onChange={handleChange('name')}
                disabled={disabled}
                required={required}
                error={!!errors.name}
                helperText={errors.name}
                onBlur={() => {
                  if (!state.name) {
                    setErrors(errors => ({...errors, name: 'This field cannot be empty'}));
                  }else {
                    setErrors(errors => ({...errors, name: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={6}>
              <Dropdown
                label={'Organizations'}
                key={'organizations'}
                value={state.organizations}
                onChange={handleChange('organizations')}
                options={options}
                error={!!errors.organizations}
                helperText={errors.organizations}
                disabled={disabled || disabledOrganization}
                onBlur={() => {
                  if (state.organizations.length === 0) {
                    setErrors(errors => ({...errors, organizations: 'This field cannot be empty'}));
                  }else {
                    setErrors(errors => ({...errors, name: null}));
                  }
                }
                }
                sx={{mt: 2}}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Description"
                type="text"
                defaultValue={state.description}
                onChange={handleChange('description')}
                required={required}
                disabled={disabled}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                minRows={4}
                onBlur={() => {
                  if (!state.description) {
                    setErrors(errors => ({...errors, description: 'This field cannot be empty'}));
                  }else {
                    setErrors(errors => ({...errors, description: null}));
                  }
                }
                }
              />
            </Grid>


          </Grid>
        </>
      }
    </Paper>
  );
}