import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {fetchOrganizationsInterfaces} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";
import {fetchOutcomeInterfaces, fetchOutcomes} from '../../api/outcomeApi';
import GeneralField from "./fields/GeneralField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {fetchStakeholderOutcomeInterface} from "../../api/stakeholderOutcomeAPI";
import {fetchIndicatorInterfaces} from "../../api/indicatorApi";


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

export default function ImpactReportField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization, uriDiasbled}) {

  const [state, setState] = useState(
    defaultValue ||
    {});

  const [options, setOptions] = useState({
    organizations : {},stakeholderOutcomes: {}, indicators: {}
  });

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
        setLoading(false);
      }
    }).catch(e => {
      if (e.json) {
        setErrors(e.json);
      }
      reportErrorToBackend(e)
      console.log(e);
      enqueueSnackbar(e.json?.message || 'Error occurs when fetching organizations', {variant: "error"});
      setLoading(false);
    });

  }, []);

  useEffect(() => {
    if (state.organization) {
      fetchStakeholderOutcomeInterface(encodeURIComponent(state.organization)).then(({stakeholderOutcomeInterfaces}) => {
        console.log(stakeholderOutcomeInterfaces)
        setOptions(ops => ({...ops, stakeholderOutcomes: stakeholderOutcomeInterfaces}))
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e)
        console.log(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when fetching outcomes', {variant: "error"});
      })
    }

  }, [state.organization])

  useEffect(() => {
    if (state.organization) {
      fetchIndicatorInterfaces(encodeURIComponent(state.organization)).then(({indicatorInterfaces}) => {
        setOptions(ops => ({...ops, indicators: indicatorInterfaces}))
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e)
        console.log(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when fetching indicators', {variant: "error"});
      })
    }

  }, [state.organization])

  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  const handleChange = name => (e, value) => {
    console.log(name)
    if(name !== 'outcome'){
      setState(state => {
        state[name] = value ?? e.target.value;
        return state;
      });
    } else {
      setState(state => {
        state.outcome = value;
        state.unitOfMeasure = outcomes[value]?.unitOfMeasure?.label;
        return state
      });
    }
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
                disabled={disabled}
                required={required}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={() => {
                  if (!state.uri) {
                    setErrors(errors => ({...errors, uri: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, uri: null}));
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
                label={"Stakeholder Outcome"}
                disabled={!state.organization}
                options={options.stakeholderOutcomes}
                state={state.forStakeholderOutcome}
                onChange={
                  handleChange('forStakeholderOutcome')
                }
                error={!!errors.forStakeholderOutcome}
                helperText={errors.forStakeholderOutcome}
                required={required}
                onBlur={() => {
                  if (state.forStakeholderOutcome) {
                    setErrors(errors => ({...errors, forStakeholderOutcome: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Impact Scale"
                type="text"
                defaultValue={state.impactScale}
                onChange={handleChange('impactScale')}
                disabled={disabled}
                required={required}
                error={!!errors.impactScale}
                helperText={errors.impactScale}
                onBlur={() => {
                  if (!state.impactScale) {
                    setErrors(errors => ({...errors, impactScale: 'This field cannot be empty'}));
                  } if(isNaN(state.impactScale)) {
                    setErrors(errors => ({...errors, impactScale: 'This field must be a number'}));
                  } else {
                    setErrors(errors => ({...errors, impactScale: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                label={"Impact Scale Indicator"}
                disabled={!state.organization}
                options={options.indicators}
                state={state.impactScaleIndicator}
                onChange={
                  handleChange('impactScaleIndicator')
                }
                error={!!errors.impactScaleIndicator}
                helperText={errors.impactScaleIndicator}
                required={required}
                onBlur={() => {
                  if (state.impactScaleIndicator) {
                    setErrors(errors => ({...errors, impactScaleIndicator: null}));
                  }
                }
                }
              />
            </Grid>
            
            <Grid item xs={4}>
            <TextField
              sx={{mt: 2}}
              fullWidth
              label="Impact Depth"
              type="text"
              defaultValue={state.impactDepth}
              onChange={handleChange('impactDepth')}
              disabled={disabled}
              required={required}
              error={!!errors.impactDepth}
              helperText={errors.impactDepth}
              onBlur={() => {
                if (!state.impactDepth) {
                  setErrors(errors => ({...errors, impactDepth: 'This field cannot be empty'}));
                } if(isNaN(state.impactDepth)) {
                  setErrors(errors => ({...errors, impactDepth: 'This field must be a number'}));
                } else {
                  setErrors(errors => ({...errors, impactDepth: null}));
                }
              }
              }
            />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                label={"Impact Depth Indicator"}
                disabled={!state.organization}
                options={options.indicators}
                state={state.impactDepthIndicator}
                onChange={
                  handleChange('impactDepthIndicator')
                }
                error={!!errors.impactDepthIndicator}
                helperText={errors.impactDepthIndicator}
                required={required}
                onBlur={() => {
                  if (state.impactDepthIndicator) {
                    setErrors(errors => ({...errors, impactDepthIndicator: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Report Impact"
                options={["positive", "negative", "neutral"]}
                onChange={handleChange('Report Impact')}
                value={state.ReportImpact}
                required={required}
                disabled={true}
              />
            </Grid>

            <Grid item xs={8}>
            <TextField
              sx={{mt: 2}}
              fullWidth
              label="Impact Duration"
              type="text"
              defaultValue={state.ImpactDuration}
              onChange={handleChange('ImpactDuration')}
              disabled={true}
              required={required}
              error={!!errors.ImpactDuration}
              helperText={errors.ImpactDuration}
            />
            </Grid>
        
            <Grid item xs={3}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.startTime}
                label={'Start Time'}
                minWidth={187}
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

            <Grid item xs={3}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.endTime}
                label={'End Time'}
                minWidth={187}
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
            <Grid item xs={6}>
              <GeneralField
                fullWidth
                label="Impact Risk"
                type="text"
                defaultValue={state.impactRisk}
                onChange={handleChange('impactRisk')}
                required={required}
                disabled
                error={!!errors.impactRisk}
                helperText={errors.impactRisk}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expectation"
                type="text"
                defaultValue={state.expectation}
                onChange={handleChange('expectation')}
                required={required}
                disabled
                error={!!errors.expectation}
                helperText={errors.expectation}
                multiline
                minRows={1}
                onBlur={() => {
                  if (!state.expectation) {
                    setErrors(errors => ({...errors, expectation: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, expectation: null}));
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
