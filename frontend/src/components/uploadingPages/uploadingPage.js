import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {createOrganization, fetchOrganization, updateOrganization} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import FileUploader from "../shared/fields/fileUploader";

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
    submitDialog: false,
    loadingButton: false,
    fileType: useParams().fileType,
    formType: useParams().formType,
  });
  const [options, setOptions] = useState({
    fileTypes: ['JSON'],
    formTypes: ['Indicator', 'Indicator Report', 'Outcome'],
  })
  const [errors, setErrors] = useState(
    {}
  );


  useEffect(() => {
    // if (fileType !== state.fileType || formType !== state.formType) {
    //   if (fileType !== state.fileType)
    //     setState(state => ({...state, fileType: fileType}));
    //   if (formType !== state.formType)
    //     setState(state => ({...state, formType: formType}));
    //   navigate(`/fileUploading/${fileType}/${formType}`);
    // }


  }, []);


  const validate = () => {
    const error = {};
    if (!form.legalName) {
      error.legalName = 'The field cannot be empty';
    }
    if (!form.ID) {
      error.ID = 'The field cannot be empty';
    }
    setErrors(error);

    // const outcomeFormErrors = [];
    // outcomeForm.map((outcome, index) => {
    //   if(!outcome.name) {
    //     if (!outcomeFormErrors[index])
    //       outcomeFormErrors[index] = {};
    //     outcomeFormErrors[index].name = 'This field cannot be empty';
    //   }
    //   if(!outcome.domain) {
    //     if (!outcomeFormErrors[index])
    //       outcomeFormErrors[index] = {};
    //     outcomeFormErrors[index].domain = 'This field cannot be empty';
    //   }
    //   if(!outcome.description) {
    //     if (!outcomeFormErrors[index])
    //       outcomeFormErrors[index] = {};
    //     outcomeFormErrors[index].description = 'This field cannot be empty';
    //   }
    // })
    // setOutcomeFormErrors(outcomeFormErrors);

    // const indicatorFormErrors = [];
    // indicatorForm.map((indicator, index) => {
    //   if(!indicator.name) {
    //     if(!indicatorFormErrors[index])
    //       indicatorFormErrors[index] = {};
    //     indicatorFormErrors[index].name = 'This field cannot be empty';
    //   }
    //   if(!indicator.description) {
    //     if (!indicatorFormErrors[index])
    //       indicatorFormErrors[index] = {};
    //     indicatorFormErrors[index].description = 'This field cannot be empty';
    //   }
    // })
    // setIndicatorFormErrors(indicatorFormErrors)
    return Object.keys(error).length === 0;
    // && outcomeFormErrors.length === 0 && indicatorFormErrors.length === 0;
  };


  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Organization Basic </Typography>

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

          }}
          onChange={e => {
            setState(state => ({
                ...state, formType: e.target.value
              })
            );
          }}
        />

        <FileUploader title={state.fileType && state.formType? `Please upload a ${state.formType} ${state.fileType} file`: 'Please choose file and form type'} disabled={!(state.fileType && state.formType)}/>
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


        {/*<AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}*/}
        {/*             dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Organization?' :*/}
        {/*               'Are you sure you want to update this Organization?'}*/}
        {/*             buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}*/}
        {/*                               key={'cancel'}>{'cancel'}</Button>,*/}
        {/*               <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}*/}
        {/*                              key={'confirm'}*/}
        {/*                              onClick={handleConfirm} children="confirm" autoFocus/>]}*/}
        {/*             open={state.submitDialog}/>*/}
      </Paper>


      {/*<Paper sx={{p: 2}} variant={'outlined'}>*/}
      {/*  <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>*/}
      {/*    Submit*/}
      {/*  </Button>*/}
      {/*</Paper>*/}

    </Container>);

}