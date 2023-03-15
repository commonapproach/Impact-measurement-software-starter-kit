import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {createOrganization, fetchOrganization, fetchOrganizations, updateOrganization} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import FileUploader from "../shared/fields/fileUploader";
import {createIndicator} from "../../api/indicatorApi";

const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginLeft: 10,
    marginTop: 12,
    marginBottom: 0,
    length: 100
  },
  link: {
    marginTop: 20,
    marginLeft: 15,
    color: '#007dff',
  }
}));


export default function FileUploadingPage() {

  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();
  const schemas = {
    'Indicator': {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: {type: 'string'},
        dateCreated: {type: 'string', format: 'time'},
      },
      required: ['name', 'description']
    },
    'Indicator Report': {
      type: 'object',
      properties: {
        name: { type: 'string' },
        comment: {type: 'string'},
        numericalValue: {type: 'number'},
        unitOfMeasure: {type: 'string'},
        startTime: {type: 'string'},
        endTime: {type: 'string'},
        dateCreated: {type: 'string', format: 'time'},
      },
      required: ['name', 'comment', 'numericalValue', 'unitOfMeasure', 'startTime', 'endTime', 'dateCreated']
    },
    'Outcome':{
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: {type: 'string'},
      },
      required: ['name', 'description']
    }
  }

  const createAPIs = {
    Indicator: createIndicator
  }

  const [state, setState] = useState({
    loading: true,
    submitDialog: false,
    loadingButton: false,
    fileType: useParams().fileType,
    formType: useParams().formType,
    organization: useParams().orgID,
    fileContent: null
  });
  const [options, setOptions] = useState({
    fileTypes: ['JSON'],
    formTypes: ['Indicator', 'Indicator Report', 'Outcome'],
    organizations: {}
  })
  const [errors, setErrors] = useState(
    {}
  );


  useEffect(() => {
    fetchOrganizations().then(res => {
      if(res.success)
        res.organizations.map(organization => {
          options.organizations[organization._id] = organization.legalName;
        })
        setState(state => ({...state, loading: false}));
    }).catch(e => {
      reportErrorToBackend(e)
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });


  }, []);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = async () => {
    try {
      setState(state => ({...state, loadingButton: true}));
      const form = {
        name: state.fileContent.name,
        organizations: [state.organization],
        description: state.fileContent.description
      }
      const res = await createAPIs[state.formType]({form});
      if (res.success) {
        setState({loadingButton: false, submitDialog: false,});
        navigate('/dashboard');
        enqueueSnackbar(res.message || 'Success', {variant: "success"});
      }
    } catch (e) {

    }
  }

  const validate = () => {
    const error = {};
    if (!state.fileType) {
      error.fileType = 'The field cannot be empty';
    }
    if (!state.formType) {
      error.formType = 'The field cannot be empty';
    }
    if(!state.organization) {
      error.organization = 'The field cannot be empty';
    }
    if(!state.fileContent) {
      error.fileContent = 'The field cannot be empty';
    }
    setErrors(error);
    return Object.keys(error).length === 0;
  };



  if (state.loading)
    return <Loading message={`Loading organizations...`}/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> File Uploading </Typography>

        <SelectField
          // disabled={mode === 'new' || !userContext.isSuperuser}
          key={'fileType'}
          label={'File Type'}
          value={state.fileType}
          options={options.fileTypes}
          error={!!errors.fileType}
          helperText={
            errors.fileType
          }
          onBlur={() => {
            if (!state.fileType) {
              setErrors(errors => ({...errors, fileType: 'The field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, fileType: null}));
            }
          }}
          onChange={e => {
            setState(state => ({
                ...state, fileType: e.target.value
              })
            );
          }}
        />
        <SelectField
          // disabled={mode === 'new' || !userContext.isSuperuser}
          key={'formType'}
          label={'Form Type'}
          value={state.formType}
          options={options.formTypes}
          error={!!errors.formType}
          helperText={
            errors.formType
          }
          onBlur={() => {
            if (!state.formType) {
              setErrors(errors => ({...errors, formType: 'The field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, formType: null}));
            }
          }}
          onChange={e => {
            setState(state => ({
                ...state, formType: e.target.value
              })
            );
          }}
        />
        <SelectField
          // disabled={mode === 'new' || !userContext.isSuperuser}
          key={'organization'}
          label={'Organization'}
          value={state.organization}
          options={options.organizations}
          error={!!errors.organization}
          helperText={
            errors.organization
          }
          onBlur={() => {
            if (!state.organization) {
              setErrors(errors => ({...errors, organization: 'The field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, organization: null}));
            }
          }}
          onChange={e => {
            setState(state => ({
                ...state, organization: e.target.value
              })
            );
          }}
        />

        <FileUploader title={state.fileType && state.formType? `Please upload a ${state.formType} ${state.fileType} file`:
          'Please choose file and form type'}
                      disabled={!(state.fileType && state.formType)}
                      schema={schemas[state.formType]}
                      onchange={(fileContent) => {
                        setState(state => ({...state, fileContent: fileContent}))
                      }}
                      importedError={errors.fileContent}
        />
        {/*<Dropdown*/}
        {/*  label="Editors"*/}
        {/*  key={'editors'}*/}
        {/*  disabled={mode === 'new'}*/}
        {/*  value={form.editors}*/}
        {/*  onChange={e => {*/}
        {/*    form.editors = e.target.value;*/}
        {/*  }}*/}
        {/*  options={options.objectForm}*/}
        {/*  error={!!errors.editors}*/}
        {/*  helperText={errors.editors}*/}
        {/*  // sx={{mb: 2}}*/}
        {/*/>*/}
        {/*<Dropdown*/}
        {/*  label="Reporters"*/}
        {/*  key={'reporters'}*/}
        {/*  value={form.reporters}*/}
        {/*  disabled={mode === 'new'}*/}
        {/*  onChange={e => {*/}
        {/*    form.reporters = e.target.value;*/}
        {/*  }}*/}
        {/*  options={options.objectForm}*/}
        {/*  error={!!errors.reporters}*/}
        {/*  helperText={errors.reporters}*/}
        {/*  // sx={{mb: 2}}*/}
        {/*/>*/}
        {/*<Dropdown*/}
        {/*  label="Researcher"*/}
        {/*  key={'researcher'}*/}
        {/*  value={form.researchers}*/}
        {/*  disabled={mode === 'new'}*/}
        {/*  onChange={e => {*/}
        {/*    form.researchers = e.target.value;*/}
        {/*  }}*/}
        {/*  options={options.objectForm}*/}
        {/*  error={!!errors.researchers}*/}
        {/*  helperText={errors.researchers}*/}
        {/*  // sx={{mb: 2}}*/}
        {/*/>*/}
        {/*<GeneralField*/}
        {/*  key={'comment'}*/}
        {/*  label={'Comment'}*/}
        {/*  value={form.comment}*/}
        {/*  sx={{mt: '16px', minWidth: 350}}*/}
        {/*  onChange={e => form.comment = e.target.value}*/}
        {/*  error={!!errors.comment}*/}
        {/*  helperText={errors.comment}*/}
        {/*  minRows={4}*/}
        {/*  multiline*/}
        {/*/>*/}


        <AlertDialog dialogContentText={state.loadingButton?'Please wait a second...':"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={state.loadingButton?'Checking is processing...':'Are you sure you want to submit?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>


      <Paper sx={{p: 2}} variant={'outlined'}>
        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>
      </Paper>

    </Container>);

}