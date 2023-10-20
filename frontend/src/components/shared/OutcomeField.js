import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {fetchThemes} from "../../api/themeApi";
import {fetchOrganizations, fetchOrganizationsInterfaces} from "../../api/organizationApi";
import {UserContext} from "../../context";
import Dropdown from "./fields/MultiSelectField";
import {fetchIndicators} from "../../api/indicatorApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {fetchCodesInterfaces} from "../../api/codeAPI";


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
                                       disableURI,
                                       disabled,
                                       importErrors,
                                     }) {

  const [state, setState] = useState(defaultValue || {});

  const [options, setOptions] = useState({themes: {}, indicators: {}, codes: {}});

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
                options.themes[theme._uri] = theme.name;
              }
            );
        }),
      fetchOrganizationsInterfaces().then(({success, organizations}) => {
        if (success) {
          const options = {};
          organizations.map(organization => {
            // only organization which the user serves as an editor should be able to add
            options[organization._uri] = organization.legalName;
          });
          setOptions(op => ({...op, organization: options}));
        }
      }),
      fetchCodesInterfaces().then(({success, codesInterfaces}) => {
        if (success) {
          setOptions(op => ({...op, codes: codesInterfaces}));
        }
      })
    ]).then(() => setLoading(false));

  }, []);

  useEffect(() => {
    if (state.organization) {
      fetchIndicators(encodeURIComponent(state.organization)).then(({success, indicators}) => {
        if (success) {
          const inds = {};
          indicators.map(indicator => {
            inds[indicator._uri] = indicator.name;
          });
          setOptions(ops => ({...ops, indicators: inds}));
        }
      });
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
            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="URI"
                type="text"
                defaultValue={state.uri}
                onChange={handleChange('uri')}
                disabled={disabled || disableURI}
                required={required}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={() => {
                  if (state.uri && !isValidURL(state.uri)) {
                    setErrors(errors => ({...errors, uri: 'Please input a valid URI'}));
                  } else {
                    setErrors(errors => ({...errors, uri: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={6}>
              <Dropdown
                label="Themes"
                options={options.themes}
                value={state.themes}
                onChange={(e) => {
                  setState(state => ({...state, themes: e.target.value}));
                  const st = state;
                  st.themes = e.target.value;
                  onChange(st);
                }
                }
                // error={!!errors.themes}
                // helperText={errors.themes}
                disabled={disabled}
                // onBlur={() => {
                //   if (!state.themes.length) {
                //     setErrors(errors => ({...errors, themes: 'This field cannot be empty'}));
                //   } else {
                //     setErrors(errors => ({...errors, themes: null}));
                //   }
                // }
                // }
              />
            </Grid>
            <Grid item xs={6}>
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

            <Grid item xs={12}>
              <Dropdown
                label="Codes"
                options={options.codes}
                value={state.codes}
                onChange={(e) => {
                  setState(state => ({...state, codes: e.target.value}));
                  const st = state;
                  st.codes = e.target.value;
                  onChange(st);
                }
                }
                minWidth={775}
                disabled={disabled}
              />
            </Grid>
            <Grid item xs={12}>
              <Dropdown
                label="Indicators"
                key={'indicators'}
                options={options.indicators}
                onChange={(e) => {
                  setState(state => ({...state, indicators: e.target.value}));
                  const st = state;
                  st.indicators = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.indicators}
                error={!!errors.indicators}
                helperText={errors.indicators}
                required={required}
                disabled={disabled || !state.organization}
                onBlur={() => {
                  if (!state.indicators) {
                    setErrors(errors => ({...errors, indicators: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, indicators: null}));
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
