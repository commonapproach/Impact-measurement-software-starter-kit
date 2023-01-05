import React, {useEffect, useState} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {getInstancesInClass} from "../../api/dynamicClassInstance";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {Validator} from "../../helpers";
import {fetchDomains} from "../../api/domainApi";


const filterOptions = createFilterOptions({
  ignoreAccents: false,
  matchFrom: 'start'
});


function LoadingAutoComplete({label, options, property, state, onChange, disabled, error, helperText, required, onBlur}) {
  return (
    <Autocomplete
      sx={{mt: 2}}
      options={Object.keys(options[property])}
      getOptionLabel={(key) => options[property][key]}
      fullWidth
      value={state[property]}
      onChange={onChange(property)}
      filterOptions={filterOptions}
      renderInput={(params) =>
        <TextField
          {...params}
          required={required}
          label={label}
          disabled={disabled}
          error={error}
          helperText={helperText}
          onBlur={onBlur}
        />
      }
    />
  );
}

export default function OutcomeField({value: defaultValue, required, onChange, label, disabled, importErrors}) {

  const [state, setState] = useState(defaultValue || {});

  const [options, setOptions] = useState({domain: {}});

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  useEffect(() => {
    Promise.all([
      fetchDomains()
        .then(res => {
          if (res.success)
            res.domains.map(
              domain => {
                options.domain[domain._id] = domain.name;
              }
            );
        }),
    ]).then(() => setLoading(false));

  }, []);

  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

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
      <Typography variant="h5">
        {loading && <CircularProgress color="inherit" size={20}/>} {label} {required ? '*' : ''}
      </Typography>
      {!loading &&
        <>
          <Grid container columnSpacing={2}>
            <Grid item xs={6}>
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
              <LoadingAutoComplete
                label="Domain"
                options={options}
                property={'domain'}
                state={state}
                onChange={handleChange}
                error={!!errors.domain}
                helperText={errors.domain}
                required={required}
                disabled={disabled}
                onBlur={() => {
                  if (!state.domain) {
                    setErrors(errors => ({...errors, domain: 'This field cannot be empty'}));
                  }else {
                    setErrors(errors => ({...errors, domain: null}));
                  }
                }
                }
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
