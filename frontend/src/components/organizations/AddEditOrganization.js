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


export default function AddEditOrganization() {

  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {id} = useParams();
  const mode = id ? 'edit' : 'new';
  const {enqueueSnackbar} = useSnackbar();

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  // const [outcomeFormErrors, setOutcomeFormErrors] = useState([{
  //
  // }])

  // const [indicatorForm, setIndicatorForm] = useState([]);

  // const [indicatorFormErrors, setIndicatorFormErrors] = useState([{
  //
  // }])

  const [form, setForm] = useState({
    legalName: '',
    ID: '',
    administrator: '',
    reporters: [],
    editors: [],
    researchers: [],
    comment: '',
  });
  // const [outcomeForm, setOutcomeForm] = useState([
  // ]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    objectForm: {},
  });


  useEffect(() => {

    fetchUsers(id).then(({data, success}) => {
      const objectForm = {};
      data.map(user => {
        objectForm[user._id] = `${user.person.givenName} ${user.person.familyName} ID: ${user._id}`;
      });
      if (success)
        setOptions({objectForm,});

    }).then(() => {
      if (mode === 'edit' && id) {
        fetchOrganization(id, userContext).then(res => {
          if (res.success) {
            const {organization} = res;
            setForm({
              legalName: organization.legalName || '',
              ID: organization.ID || '',
              administrator: organization.administrator || '',
              reporters: organization.reporters || [],
              editors: organization.editors || [],
              researchers: organization.researchers || [],
              comment: organization.comment || ''
            });
            // setOutcomeForm(outcomes)
            // setIndicatorForm(indicators)
            setLoading(false);
          }
        }).catch(e => {
          if (e.json)
            setErrors(e.json);
          setLoading(false);
          reportErrorToBackend(e)
          enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
        });
      } else if (mode === 'edit' && !id) {
        navigate('/organizations');
        enqueueSnackbar("No ID provided", {variant: 'error'});
      } else if (mode === 'new') {
        setLoading(false);
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json);
      reportErrorToBackend(e)
      setLoading(false);

      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });


  }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createOrganization({form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organizations');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e)
        enqueueSnackbar(e.json?.message || 'Error occurs when creating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      updateOrganization(id, {form}, userContext).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organizations');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e)
        enqueueSnackbar(e.json?.message || 'Error occurs when updating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

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

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Organization Basic</Typography>
        <GeneralField
          disabled={!userContext.isSuperuser}
          key={'legalName'}
          label={'Legal Name'}
          value={form.legalName}
          required
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.legalName = e.target.value}
          error={!!errors.legalName}
          helperText={errors.legalName}
          onBlur={() => {
            if (form.legalName === '') {
              setErrors(errors => ({...errors, legalName: 'This field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, legalName: ''}));
            }

          }}
        />

        <GeneralField
          disabled={!userContext.isSuperuser}
          key={'ID'}
          label={'ID'}
          value={form.ID}
          required
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.ID = e.target.value}
          error={!!errors.ID}
          helperText={errors.ID}
          onBlur={() => {
            if (form.ID === '') {
              setErrors(errors => ({...errors, ID: 'This field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, ID: ''}));
            }

          }}
        />

        <SelectField
          disabled={mode === 'new' || !userContext.isSuperuser}
          key={'administrator'}
          label={'Organization Administrator'}
          value={form.administrator}
          options={options.objectForm}
          error={!!errors.administrator}
          helperText={
            errors.administrator
          }
          onBlur={() => {
            if (form.administrator === '') {
              setErrors(errors => ({...errors, administrator: 'This field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, administrator: ''}));
            }

          }}
          onChange={e => {
            setForm(form => ({
                ...form, administrator: e.target.value
              })
            );
          }}
        />
        <Dropdown
          label="Editors"
          key={'editors'}
          disabled={mode === 'new'}
          value={form.editors}
          onChange={e => {
            form.editors = e.target.value;
          }}
          options={options.objectForm}
          error={!!errors.editors}
          helperText={errors.editors}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Reporters"
          key={'reporters'}
          value={form.reporters}
          disabled={mode === 'new'}
          onChange={e => {
            form.reporters = e.target.value;
          }}
          options={options.objectForm}
          error={!!errors.reporters}
          helperText={errors.reporters}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Researcher"
          key={'researcher'}
          value={form.researchers}
          disabled={mode === 'new'}
          onChange={e => {
            form.researchers = e.target.value;
          }}
          options={options.objectForm}
          error={!!errors.researchers}
          helperText={errors.researchers}
          // sx={{mb: 2}}
        />
        <GeneralField
          key={'comment'}
          label={'Comment'}
          value={form.comment}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.comment = e.target.value}
          error={!!errors.comment}
          helperText={errors.comment}
          minRows={4}
          multiline
        />


        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Organization?' :
                       'Are you sure you want to update this Organization?'}
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