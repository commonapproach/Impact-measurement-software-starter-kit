import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {fetchOrganizations, fetchOrganizationsInterfaces} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";
import {fetchIndicators} from "../../api/indicatorApi";
import GeneralField from "./fields/GeneralField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isValidURL} from "../../helpers/validation_helpers";


const filterOptions = createFilterOptions({
  ignoreAccents: false,
  matchFrom: 'start'
});


function LoadingAutoComplete({
                               label,
                               options,
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
      options={Object.keys(options)}
      getOptionLabel={(key) => options[key]}
      fullWidth
      value={state}
      onChange={onChange}
      disabled={disabled}
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

export default function IndicatorReportField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization, uriDiasbled}) {

  const [state, setState] = useState(
    defaultValue ||
    {});

  const [options, setOptions] = useState({});
  const {enqueueSnackbar} = useSnackbar();

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  const userContext = useContext(UserContext);


  useEffect(() => {
    fetchOrganizationsInterfaces().then(({success, organizations}) => {
      if (success) {
        const options = {};
        organizations.map(organization => {
          // only organization which the user serves as an editor should be able to add
          options[organization._uri] = organization.legalName;
        });
        setOptions(op => ({...op, organization: options}));
        return options;
      }
    }).then((organizations) => {
        Promise.all(Object.keys(organizations).map(organizationUri => {
          return fetchIndicators(encodeURIComponent(organizationUri), userContext).then(({success, indicators}) => {
            if (success) {
              const options = {};
              indicators.map(indicator => {
                options[indicator._uri] = indicator.name;
              });
              setOptions(op => ({
                  ...op,
                  [organizationUri]: options
                })
              );
            }
          });
        })).then(() => {
          setLoading(false);
          setOptions(op => {
            return op
          })
        }).catch(e => {
          if (e.json) {
            setErrors(e.json);
          }
          console.log(e);
          reportErrorToBackend(e)
          enqueueSnackbar(e.json?.message || 'Error occurs when fetching data', {variant: "error"});
          setLoading(false);
        });
      }
    ).catch(e => {
      if (e.json) {
        setErrors(e.json);
      }
      reportErrorToBackend(e)
      console.log(e);
      enqueueSnackbar(e.json?.message || 'Error occurs when fetching data', {variant: "error"});
      setLoading(false);
    });

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
                disabled={disabled || uriDiasbled}
                required={required}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={() => {
                  if (state.uri && !isValidURL(state.uri)) {
                    setErrors(errors => ({...errors, uri: 'Invalid URI'}));
                  } else {
                    setErrors(errors => ({...errors, uri: null}));
                  }
                }
                }
              />
            </Grid>


            <Grid item xs={4}>
            <TextField
              sx={{mt: 2}}
              fullWidth
              label="Numerical Value"
              type="text"
              defaultValue={state.numericalValue}
              onChange={handleChange('numericalValue')}
              disabled={disabled}
              required={required}
              error={!!errors.numericalValue}
              helperText={errors.numericalValue}
              onBlur={() => {
                if (!state.numericalValue) {
                  setErrors(errors => ({...errors, numericalValue: 'This field cannot be empty'}));
                } if(isNaN(state.numericalValue)) {
                  setErrors(errors => ({...errors, numericalValue: 'This field must be a number'}));
                } else {
                  setErrors(errors => ({...errors, numericalValue: null}));
                }
              }
              }
            />
            </Grid>
            {/*<Grid item xs={4}>*/}
            {/*  <TextField*/}
            {/*    sx={{mt: 2}}*/}
            {/*    fullWidth*/}
            {/*    label="Unit of Measure"*/}
            {/*    type="text"*/}
            {/*    defaultValue={state.unitOfMeasure}*/}
            {/*    onChange={handleChange('unitOfMeasure')}*/}
            {/*    disabled={disabled}*/}
            {/*    required={required}*/}
            {/*    error={!!errors.unitOfMeasure}*/}
            {/*    helperText={errors.unitOfMeasure}*/}
            {/*    onBlur={() => {*/}
            {/*      if (!state.unitOfMeasure) {*/}
            {/*        setErrors(errors => ({...errors, unitOfMeasure: 'This field cannot be empty'}));*/}
            {/*      } else {*/}
            {/*        setErrors(errors => ({...errors, unitOfMeasure: null}));*/}
            {/*      }*/}
            {/*    }*/}
            {/*    }*/}
            {/*  />*/}
            {/*</Grid>*/}
            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Organization"
                options={options.organization}
                state={state.organization}
                onChange={handleChange('organization')}
                error={!!errors.organization}
                helperText={errors.organization}
                required={required}
                disabled={disabled || disabledOrganization}
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
                disabled={disabled || !state.organization}
                options={state.organization? options[state.organization]: []}
                state={state.organization? state.indicator: null}
                onChange={handleChange('indicator')}
                error={!!errors.indicator}
                helperText={errors.indicator}
                required={required}
                onBlur={() => {
                  if (state.indicator) {
                    setErrors(errors => ({...errors, indicator: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={4}>
              <GeneralField
                fullWidth
                type={'date'}
                value={state.dateCreated}
                label={'Date Created'}
                onChange={handleChange('dateCreated')}
                required={required}
                disabled={disabled}
                error={!!errors.dateCreated}
                helperText={errors.dateCreated}
                minWidth={250}
                onBlur={() => {
                  if (!state.dateCreated) {
                    setErrors(errors => ({...errors, dateCreated: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, dateCreated: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={4}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.startTime}
                label={'Start Time'}
                minWidth={250}
                onChange={handleChange('startTime')}
                required={required}
                disabled={disabled}
                error={!!errors.startTime}
                helperText={errors.startTime}
                onBlur={() => {
                  if (!state.startTime) {
                    setErrors(errors => ({...errors, startTime: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, startTime: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={4}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.endTime}
                label={'End Time'}
                minWidth={250}
                onChange={handleChange('endTime')}
                required={required}
                disabled={disabled}
                error={!!errors.endTime}
                helperText={errors.endTime}
                onBlur={() => {
                  if (!state.endTime) {
                    setErrors(errors => ({...errors, endTime: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, endTime: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Comment"
                type="text"
                defaultValue={state.comment}
                onChange={handleChange('comment')}
                required={required}
                disabled={disabled}
                error={!!errors.comment}
                helperText={errors.comment}
                multiline
                minRows={2}
                onBlur={() => {
                  if (!state.comment) {
                    setErrors(errors => ({...errors, comment: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, comment: null}));
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
