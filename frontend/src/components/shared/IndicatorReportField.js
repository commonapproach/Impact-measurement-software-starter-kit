import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {fetchDomains} from "../../api/domainApi";
import {fetchOrganizations} from "../../api/organizationApi";
import {UserContext} from "../../context";
import Dropdown from "./fields/MultiSelectField";
import {useSnackbar} from "notistack";
import {fetchIndicators} from "../../api/indicatorApi";
import GeneralField from "./fields/GeneralField";


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

export default function IndicatorReportField({defaultValue, required, onChange, label, disabled, importErrors,}) {

  const [state, setState] = useState(
    defaultValue ||
    {});

  const [options, setOptions] = useState({});
  const {enqueueSnackbar} = useSnackbar();

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  const userContext = useContext(UserContext);


  useEffect(() => {
    fetchOrganizations(userContext).then(({success, organizations}) => {
      if (success) {
        const options = {};
        organizations.map(organization => options[organization._id] = organization.legalName);
        setOptions(op => ({...op, organization: options}));
        return options;
      }
    }).then((organizations) => {
        Promise.all(Object.keys(organizations).map(organizationId => {
          return fetchIndicators(organizationId, userContext).then(({success, indicators}) => {
            if (success) {
              const options = {};
              indicators.map(indicator => {
                options[indicator._id] = indicator.name;
              });
              setOptions(op => ({
                  ...op,
                  [`organization_${organizationId}`]: options
                })
              );
            }
          });
        })).then(() => {
          setLoading(false);
          setOptions(op => {
            console.log(op)
            return op
          })
        });
      }
    ).catch(e => {
      if (e.json) {
        setErrors(e.json);
      }
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
            <Grid item xs={4}>
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
            <TextField
              sx={{mt: 2}}
              fullWidth
              label="NumericalValue"
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
            <Grid item xs={4}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Unit of Measure"
                type="text"
                defaultValue={state.unitOfMeasure}
                onChange={handleChange('unitOfMeasure')}
                disabled={disabled}
                required={required}
                error={!!errors.unitOfMeasure}
                helperText={errors.unitOfMeasure}
                onBlur={() => {
                  if (!state.unitOfMeasure) {
                    setErrors(errors => ({...errors, unitOfMeasure: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, unitOfMeasure: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Organization"
                options={options.organization}
                state={state.organization}
                onChange={handleChange('organization')}
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
                disabled={disabled || !state.organization}
                options={state.organization? options[`organization_${state.organization}`]: []}
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
            <Grid item xs={6}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.startTime}
                label={'Start Time'}
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

            <Grid item xs={6}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.endTime}
                label={'End Time'}
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
