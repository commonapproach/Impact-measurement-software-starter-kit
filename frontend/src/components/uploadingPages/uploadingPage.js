import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {fetchOrganizations} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import FileUploader from "../shared/fields/fileUploader";
import {uploadFile} from "../../api/fileUploadingApi";

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


  const [state, setState] = useState({
    loading: true,
    submitDialog: false,
    loadingButton: false,
    fileType: useParams().fileType,
    formType: useParams().formType,
    organization: useParams().orgUri,
    fileContent: null,
    errorDialog: false,
    optionDisabled: false,
    traceOfUploading: ''
  });
  const [fileName, setFileName] = useState('')
  const [options, setOptions] = useState({
    fileTypes: ['JSON'],
    formTypes: ['Indicator', 'Indicator Report', 'Outcome'],
    organizations: {}
  });
  const [errors, setErrors] = useState(
    {}
  );
  const [errorMessage, setErrorMessage] = useState({
    title: '',
    message: ''
  });


  useEffect(() => {
    fetchOrganizations().then(res => {
      if (res.success)
        res.organizations.map(organization => {
          options.organizations[organization._uri] = organization.legalName;
        });
      setState(state => ({...state, loading: false}));
    }).catch(e => {
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
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
      let responds;
      const respond = await uploadFile(state.fileContent, state.organization, fileName)
      if (respond.success) {
        console.log(respond.traceOfUploading)
        setState(state => ({...state, loadingButton: false, submitDialog: false, traceOfUploading:  respond.traceOfUploading}));
        navigate('/dashboard');
        enqueueSnackbar(respond.message || 'Success', {variant: "success"});
      } else {

      }

    } catch (e) {
      setState(state => ({...state, loadingButton: false, submitDialog: false}));
      reportErrorToBackend(e);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    }
  };

  const validate = () => {
    const error = {};
    if (!state.organization) {
      error.organization = 'The field cannot be empty';
    }
    if (!state.fileContent) {
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
          disabled={state.optionDisabled}
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
        {/*<SelectField*/}
        {/*  disabled={state.optionDisabled}*/}
        {/*  key={'formType'}*/}
        {/*  label={'Form Type'}*/}
        {/*  value={state.formType}*/}
        {/*  options={options.formTypes}*/}
        {/*  error={!!errors.formType}*/}
        {/*  helperText={*/}
        {/*    errors.formType*/}
        {/*  }*/}
        {/*  onBlur={() => {*/}
        {/*    if (!state.formType) {*/}
        {/*      setErrors(errors => ({...errors, formType: 'The field cannot be empty'}));*/}
        {/*    } else {*/}
        {/*      setErrors(errors => ({...errors, formType: null}));*/}
        {/*    }*/}
        {/*  }}*/}
        {/*  onChange={e => {*/}
        {/*    setState(state => ({*/}
        {/*        ...state, formType: e.target.value*/}
        {/*      })*/}
        {/*    );*/}
        {/*  }}*/}
        {/*/>*/}
        <SelectField
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

        <FileUploader
          title={state.fileType ? `Please upload a ${state.fileType} file` :
            'Please choose file'}
          disabled={!state.fileType}
          onchange={(fileContent, fileName) => {
            setState(state => ({...state, fileContent: fileContent}));

            if (fileContent) {
              setState(state => ({...state, optionDisabled: true}));
            }

          }}
          updateFileName={setFileName}
          whenRemovedFile={() => {
            setState(state => ({...state, optionDisabled: false}));
          }}
          importedError={errors.fileContent}
        />


        <AlertDialog
          dialogContentText={state.loadingButton ? 'Please wait a second...' : "You won't be able to edit the information after clicking CONFIRM."}
          dialogTitle={state.loadingButton ? 'Checking is processing...' : 'Are you sure you want to submit?'}
          buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                            key={'cancel'}>{'cancel'}</Button>,
            <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                           key={'confirm'}
                           onClick={handleConfirm} children="confirm" autoFocus/>]}
          open={state.submitDialog}/>

        <AlertDialog
          dialogContentText={errorMessage.message}
          dialogTitle={errorMessage.title}
          buttons={[<Button onClick={() => setState(state => ({...state, errorDialog: false}))}
                            key={'cancel'} autoFocus>{'OK'}</Button>,]}
          open={state.errorDialog}/>
      </Paper>


      <Paper sx={{p: 2}} variant={'outlined'}>
        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>
      </Paper>

    </Container>);

}