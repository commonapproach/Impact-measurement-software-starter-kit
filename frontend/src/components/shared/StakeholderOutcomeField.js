import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {fetchOrganizationsInterfaces} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";
import {fetchIndicatorInterfaces, fetchIndicators} from "../../api/indicatorApi";
import GeneralField from "./fields/GeneralField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {fetchStakeholderInterfaces} from "../../api/stakeholderAPI";
import {fetchCodesInterfaces} from "../../api/codeAPI";
import {fetchOutcomeInterfaces} from "../../api/outcomeApi";
import Dropdown from "./fields/MultiSelectField";


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

export default function StakeholderOutcomeField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization, uriDiasbled}) {

  const [state, setState] = useState(
    defaultValue ||
    {});

  const [options, setOptions] = useState({stakeholders: {}, codes: {}, organizations: {}, outcomes: {}, indicators: {}});
  const {enqueueSnackbar} = useSnackbar();

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  const userContext = useContext(UserContext);

  useEffect(() => {
    Promise.all([
      fetchStakeholderInterfaces(), fetchCodesInterfaces(), fetchOrganizationsInterfaces()
    ]).then(([{stakeholderInterfaces}, {codesInterfaces}, {organizations}]) => {
      const organizationInterfaces = {}
      organizations.map(({legalName, _uri}) => {
        organizationInterfaces[_uri] = legalName
      })
      setOptions(op => ({...op, stakeholders: stakeholderInterfaces, codes: codesInterfaces, organizations: organizationInterfaces}));
      setLoading(false)
    }).catch(([e1, e2, e3]) => {
      const errorJson = e1.json || e2.json || e3.json
      if (errorJson) {
        setErrors(errorJson)
      }
      reportErrorToBackend(errorJson)
      console.log(e1, e2, e3)
      enqueueSnackbar(errorJson?.message || 'Error occurs when fetching data', {variant: "error"});
      setLoading(false);
    })
  }, [])

  useEffect(() => {
    if (state.organization) {
      Promise.all([
        fetchOutcomeInterfaces(encodeURIComponent(state.organization)), fetchIndicatorInterfaces(encodeURIComponent(state.organization))
      ]).then(([{outcomeInterfaces}, {indicatorInterfaces}]) => {
        setOptions(op => ({...op, outcomes: outcomeInterfaces, indicators: indicatorInterfaces}));
      });
    }
  }, [state.organization])

  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  const handleChange = name => (e, value) => {
    console.log(name)
    if(name !== 'indicator'){
      setState(state => {
        state[name] = value ?? e.target.value;
        return state;
      });
    } else {
      setState(state => {
        state.indicator = value;
        state.unitOfMeasure = indicators[value]?.unitOfMeasure?.label;
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
            {console.log(options.organizations)}
            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Organization"
                options={options.organizations}
                state={state.organization}
                onChange={handleChange('organization')}
                error={!!errors.organization}
                helperText={errors.organization}
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
                label="Stakeholder"
                options={options.stakeholders}
                state={state.stakeholder}
                onChange={handleChange('stakeholder')}
                error={!!errors.stakeholder}
                helperText={errors.stakeholder}
                required={required}
                onBlur={() => {
                  if (!state.stakeholder) {
                    setErrors(errors => ({...errors, stakeholder: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, stakeholder: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={12}>
              <LoadingAutoComplete
                label={"Outcome"}
                options={options.outcomes}
                state={state.outcome}
                onChange={
                  handleChange('outcome')
                }
                disabled={!state.organization}
                error={!!errors.outcome}
                helperText={errors.outcome}
                onBlur={() => {
                  if (state.outcome) {
                    setErrors(errors => ({...errors, outcome: null}));
                  }
                }
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Dropdown
                label="Indicators"
                options={options.indicators}
                value={state.indicators}
                disabled={!state.organization}
                onChange={(e) => {
                  setState(state => ({...state, indicators: e.target.value}));
                  const st = state;
                  st.indicators = e.target.value;
                  onChange(st);
                }
                }
              />
            </Grid>
            <Grid item xs={3}>
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
                minWidth={188}
              />
            </Grid>
            <Grid item xs={3}>
              <LoadingAutoComplete
                label={"Importance"}
                options={{'high importance': 'high importance', 'moderate': 'moderate'}}
                state={state.importance}
                onChange={
                  handleChange('importance')
                }
                error={!!errors.importance}
                helperText={errors.importance}
                required={required}
              />
            </Grid>
            <Grid item xs={3}>
              <LoadingAutoComplete
                label={"Is Underserved"}
                options={{true: 'true', false: 'false'}}
                state={state.isUnderserved}
                onChange={
                  handleChange('isUnderserved')
                }
                error={!!errors.isUnderserved}
                helperText={errors.isUnderserved}
                required={required}
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
                minRows={2}
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
