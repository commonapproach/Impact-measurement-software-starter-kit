import React, {useEffect, useState} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {getInstancesInClass} from "../../api/dynamicClassInstance";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {Validator} from "../../helpers";


const filterOptions = createFilterOptions({
  ignoreAccents: false,
  matchFrom: 'start'
});

const numberChecker = (value) => {
    if(isNaN(value))
      return 'This field should be a number.'
    return null
}

function LoadingAutoComplete({label, options, property, state, onChange, disabled, error, helperText}) {
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
          label={label}
          disabled={disabled}
          error={error}
          helperText={helperText}
        />
      }
    />
  );
}

export default function AddressField({value: defaultValue, required, onChange, label, disabled, importErrors}) {

  const [state, setState] = useState(defaultValue || {});

  const [options, setOptions] = useState({streetType: {}, streetDirection: {}, state: {}});

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  useEffect(() => {
    Promise.all([
      getInstancesInClass('ic:StreetType')
        .then(streetType => {
          setOptions(options => ({...options, streetType}));
        }),
      getInstancesInClass('ic:StreetDirection')
        .then(streetDirection => {
          setOptions(options => ({...options, streetDirection}));
        }),
      getInstancesInClass('schema:State')
        .then(state => {
          setOptions(options => ({...options, state}));
        }),
    ]).then(() => setLoading(false));

  }, []);

  const handleChange = name => (e, value) => {
    state[name] = value ?? e.target.value;
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
            <Grid item xs={3}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Unit/Apt/Suit #"
                type="text"
                defaultValue={state.unitNumber}
                onChange={handleChange('unitNumber')}
                disabled={disabled}
                error={!!errors.unitNumber}
                helperText={errors.unitNumber}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Street number"
                type="text"
                defaultValue={state.streetNumber}
                onChange={handleChange('streetNumber')}
                disabled={disabled}
                error={!!errors.streetNumber}
                helperText={errors.streetNumber}
                onBlur={e => {
                setErrors(errors => ({...errors, streetNumber: numberChecker(e.target.value)}))}
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Street name"
                type="text"
                defaultValue={state.streetName}
                onChange={handleChange('streetName')}
                required={required}
                disabled={disabled}
                error={!!errors.streetName}
                helperText={errors.streetName}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingAutoComplete
                label="Street type"
                options={options}
                property={'streetType'}
                state={state}
                onChange={handleChange}
                error={!!errors.streetType}
                helperText={errors.streetType}
                disabled={disabled}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingAutoComplete
                label="Street direction"
                options={options}
                property={'streetDirection'}
                state={state}
                onChange={handleChange}
                error={!!errors.streetDirection}
                helperText={errors.streetDirection}
                disabled={disabled}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="City"
                type="text"
                defaultValue={state.city}
                onChange={handleChange('city')}
                required={required}
                disabled={disabled}
                error={!!errors.city}
                helperText={errors.city}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingAutoComplete
                label="Province"
                options={options}
                property={'state'}
                state={state}
                onChange={handleChange}
                disabled={disabled}
                error={!!errors.state}
                helperText={errors.state}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                sx={{mt: '16px'}}
                fullWidth
                label="Postal Code"
                type="text"
                defaultValue={state.postalCode}
                onChange={handleChange('postalCode')}
                required={required}
                disabled={disabled}
                error={!!errors.postalCode}
                helperText={errors.postalCode}
                onBlur={e => {
                setErrors(errors => ({...errors, postalCode: Validator.postalCode(e.target.value)})
                )}
                }
              />
            </Grid>
          </Grid>
        </>
      }
    </Paper>
  );
}
