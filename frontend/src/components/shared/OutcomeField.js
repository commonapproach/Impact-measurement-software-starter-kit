import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {fetchThemes} from "../../api/themeApi";
import {fetchOrganizations} from "../../api/organizationApi";
import {UserContext} from "../../context";
import Dropdown from "./fields/MultiSelectField";
import {fetchIndicators} from "../../api/indicatorApi";


const filterOptions = createFilterOptions({
  ignoreAccents: false,
  matchFrom: 'start'
});


function LoadingAutoComplete({
                               label,
                               options,
                               property,
                               state,
                               onChange,
                               disabled,
                               error,
                               helperText,
                               required,
                               onBlur
                             }) {
  return (
    <Autocomplete
      sx={{mt: 2}}
      options={Object.keys(options[property])}
      getOptionLabel={(key) => options[property][key]}
      fullWidth
      disabled={disabled}
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

export default function OutcomeField({
                                       defaultValue,
                                       required,
                                       onChange,
                                       label,
                                       disabled,
                                       importErrors,
                                     }) {

  const [state, setState] = useState(defaultValue || {});

  const [options, setOptions] = useState({theme: {}, indicator: {}});

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});


  const userContext = useContext(UserContext);


  useEffect(() => {
    Promise.all([
      fetchThemes()
        .then(res => {
          if (res.success)
            res.themes.map(
              theme => {
                options.theme[theme._id] = theme.name;
              }
            );
        }),
      fetchOrganizations().then(({success, organizations}) => {
        if (success) {
          const options = {};
          organizations.map(organization => {
            // only organization which the user serves as an editor should be able to add
            if (userContext.isSuperuser || organization.editors?.includes(`:userAccount_${userContext.id}`))
              options[organization._id] = organization.legalName;
          });
          setOptions(op => ({...op, organization: options}));
        }
      }),
    ]).then(() => setLoading(false));

  }, []);

  useEffect(() => {
    if (state.organization) {
      fetchIndicators(state.organization).then(({success, indicators}) => {
        if (success) {
          const inds = {}
          indicators.map(indicator => {
            inds[indicator._id] = indicator.name;
          })
          setOptions(ops => ({...ops, indicator: inds}))
        }
      })
    }
  }, [state.organization]);

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
        {loading && <CircularProgress color="inherit" size={20}/>} {label}
      </Typography>
      {!loading &&
        <>
          <Grid container columnSpacing={2}>
            <Grid item xs={12}>
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
                  } else {
                    setErrors(errors => ({...errors, name: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Theme"
                options={options}
                property={'theme'}
                state={state}
                onChange={handleChange}
                error={!!errors.theme}
                helperText={errors.theme}
                required={required}
                disabled={disabled}
                onBlur={() => {
                  if (!state.theme) {
                    setErrors(errors => ({...errors, theme: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, theme: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={4}>
              <LoadingAutoComplete
                key={'organization'}
                label={"Organization"}
                options={options}
                property={'organization'}
                state={state}
                onChange={handleChange}
                error={!!errors.organization}
                helperText={errors.organization}
                required={required}
                disabled={disabled}
                onBlur={() => {
                  if (!state.organization) {
                    setErrors(errors => ({...errors, organization: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, organization: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Indicator"
                options={options}
                property={'indicator'}
                state={state}
                onChange={handleChange}
                error={!!errors.indicator}
                helperText={errors.indicator}
                required={required}
                disabled={disabled || !state.organization}
                onBlur={() => {
                  if (!state.indicator) {
                    setErrors(errors => ({...errors, indicator: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, indicator: null}));
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
                  } else {
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
