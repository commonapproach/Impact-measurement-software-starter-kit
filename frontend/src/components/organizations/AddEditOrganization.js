import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {createOrganization, fetchOrganization, updateOrganization} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import OutcomeField from "../shared/OutcomeField";

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

  const [outcomeFormErrors, setOutcomeFormErrors] = useState([{

  }])

  const [form, setForm] = useState({
    legalName: '',
    ID: '',
    administrator: '',
    reporters: [],
    editors: [],
    researchers: [],
    comment: '',
  });
  const [outcomeForm, setOutcomeForm] = useState([
  ]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    reporters: {},
    editors: {},
    researchers: {},
    administrators: [],
  });

  const [trigger, setTrigger] = useState(false)

  useEffect(() => {
    const options = {
      reporters: {},
      editors: {},
      researchers: {},
      administrators: [],
    }
    Promise.all([
      fetchUsers('editor', userContext.userTypes).then(({data}) => {
        data.map(editor => {
          options.editors[editor] = editor;
        });
      }),
      fetchUsers('reporter', userContext.userTypes).then(({data}) => {
        data.map(reporter => {
          options.reporters[reporter] = reporter;
        });
      }),
      fetchUsers('admin', userContext.userTypes).then(({data}) => {
        options.administrators = data;
      }),
      fetchUsers('researcher', userContext.userTypes).then(({data}) => {
        data.map(researcher => {
          options.researchers[researcher] = researcher;
        });
      }),
      fetchUsers('superuser', userContext.userTypes).then(({data}) => {
        data.map((superuser) => {
          options.reporters[superuser] = superuser;
          options.editors[superuser] = superuser;
          options.researchers[superuser] = superuser;
          options.administrators.push(superuser);

        });
      }),
    ]).then(() => {
      setOptions(options)
    }).then(() => {
      if (mode === 'edit' && id) {
        fetchOrganization(id, userContext.userTypes).then(res => {
          if (res.success) {
            const {organization, outcomes} = res;
            setForm({
              legalName: organization.legalName || '',
              ID: organization.ID || '',
              administrator: organization.administrator || '',
              reporters: organization.reporters || [],
              editors: organization.editors || [],
              researchers: organization.researchers || [],
              comment: organization.comment || ''
            });
            setOutcomeForm(outcomes)
            setLoading(false);
          }
        }).catch(e => {
          if (e.json)
            setErrors(e.json);
          setLoading(false);
          enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
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
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });


  }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      console.log(outcomeForm)
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createOrganization({form, outcomeForm}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organizations');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        enqueueSnackbar(e.json?.message || 'Error occurs when creating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      console.log(outcomeForm)
      updateOrganization(id, {form, outcomeForm}, userContext.userTypes).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organizations');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
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

    const outcomeFormErrors = [];
    outcomeForm.map((outcome, index) => {
      if(!outcome.name) {
        if (!outcomeFormErrors[index])
          outcomeFormErrors[index] = {};
        outcomeFormErrors[index].name = 'This field cannot be empty';
      }
      if(!outcome.domain) {
        if (!outcomeFormErrors[index])
          outcomeFormErrors[index] = {};
        outcomeFormErrors[index].domain = 'This field cannot be empty';
      }
      if(!outcome.description) {
        if (!outcomeFormErrors[index])
          outcomeFormErrors[index] = {};
        outcomeFormErrors[index].description = 'This field cannot be empty';
      }
    })
    setOutcomeFormErrors(outcomeFormErrors);
    return Object.keys(error).length === 0 && outcomeFormErrors.length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Organization Basic</Typography>
        <GeneralField
          disabled={!userContext.userTypes.includes('superuser')}
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
          disabled={!userContext.userTypes.includes('superuser')}
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

        {/*<Dropdown*/}
        {/*  label="Users"*/}
        {/*  key={'users'}*/}
        {/*  value={form.users}*/}
        {/*  onChange={e => {*/}
        {/*    form.users = e.target.value*/}
        {/*  }}*/}
        {/*  options={allUsers}*/}
        {/*  onBlur = {() => {*/}
        {/*    if(form.users.length === 0) {*/}
        {/*      setErrors(errors => ({...errors, 'userTypes': 'This field is required'}));*/}
        {/*    } else {*/}
        {/*      setErrors(errors => ({...errors, 'userTypes': null}));*/}
        {/*    }*/}
        {/*  }*/}
        {/*  }*/}
        {/*  error={!!errors.users}*/}
        {/*  helperText={errors.users}*/}
        {/*  // sx={{mb: 2}}*/}
        {/*  noEmpty*/}
        {/*  required = {true}*/}
        {/*/>*/}
        <SelectField
          disabled={!userContext.userTypes.includes('superuser')}
          key={'administrator'}
          label={'Organization Administrator'}
          value={form.administrator}
          options={options.administrators}
          error={!!errors.administrator}
          helperText={errors.administrator}
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
          value={form.editors}
          onChange={e => {
            form.editors = e.target.value;
          }}
          options={options.editors}
          error={!!errors.editors}
          helperText={errors.editors}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Reporters"
          key={'reporters'}
          value={form.reporters}
          onChange={e => {
            form.reporters = e.target.value;
          }}
          options={options.reporters}
          error={!!errors.reporters}
          helperText={errors.reporters}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Researcher"
          key={'researcher'}
          value={form.researchers}
          onChange={e => {
            form.researchers = e.target.value;
          }}
          options={options.researchers}
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
        <Typography variant={'h4'}> Outcomes </Typography>
        {outcomeForm.map((outcome, index) => {
          return <OutcomeField
            importErrors={outcomeFormErrors[index]}
            key={'outcome' + index}
            label={'outcome ' + (index + 1)}
            value={outcome}
            required
            onChange={(state) => {
              setOutcomeForm(outcomeForm => {
                outcomeForm[index] = state;
                return outcomeForm
              })
            }}
          />;
        })}
        {/*<OutcomeField*/}
        {/*value={outcomeForm[0]}*/}
        {/*onChange={(state) => {*/}
        {/*  setOutcomeForm(outcomeForm => ({...outcomeForm, 0: state}))*/}
        {/*}}*/}
        {/*label={1}*/}
        {/*/>*/}


        <Button variant="contained" color="primary" className={classes.button}
                onClick={
                  () => {
                    setOutcomeForm(outcomes => (outcomes.concat({name: '', description: '', domain: undefined})));
                    // outcomeForm.push({name: '', description: '', domain: ''})
                  }
                }
        >
          Add new
        </Button>
        <Button variant="contained" color="primary" className={classes.button}
                onClick={
                  () => {
                    setOutcomeForm(outcomes => {
                      return outcomes.splice(0, outcomes.length - 1);
                    });
                  }
                  }
                  >
                  Remove
                  </Button>

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
        </Button></Paper>

                  </Container>);

                }