import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {Loading} from "../shared";
import {Box, Button, Container, Paper, Typography, Divider} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {createQuestion, fetchQuestion, updateQuestion} from "../../api/questionApi";
import {createOrganization, fetchOrganization} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";

const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 0,
    length: 100
  },
}));


export default function AddEditOrganization() {

  const classes = useStyles();
  const navigate = useNavigate();
  const {id} = useParams();
  const mode = id? 'edit' : 'new'
  const {enqueueSnackbar} = useSnackbar();

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  const [form, setForm] = useState({
    legalName: '',
    administrator: '',
    users: [],
    comment: '',
  });
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then((res) => {
      if(res.success){
        const data = res.data;
        const users = {};
        data.map((user) => {
          users[`userAccount_${user._id}`] = `userAccount_${user._id}`;
        })
        setAllUsers(users);
      }
    }).then(() => {
      if (mode === 'edit' && id) {
      fetchOrganization(id).then(res => {
        if (res.success) {
          setForm(res.organization);
          setLoading(false);
        }
      })
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
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'add') {
      createOrganization(form).then(() => {
        setState(state => ({...state, loadingButton: false, submitDialog: false, successDialog: true}));
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        setState(state => ({...state, loadingButton: false, submitDialog: false, failDialog: true}));
      });
    } else if (mode === 'edit') {
      updateQuestion(id, form).then(() => {
        setState(state => ({...state, loadingButton: false, submitDialog: false, successDialog: true}));
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        setState(state => ({...state, loadingButton: false, submitDialog: false, failDialog: true}));
      });
    }

  };

  const validate = () => {
    const error = {};
    if (form.content === '') {
      error.content = 'The field cannot be empty';
    }
    if (form.description === '') {
      error.description = 'The field cannot be empty';
    }
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Organization </Typography>
        <GeneralField
          key={'legalName'}
          label={'Legal Name'}
          value={form.legalName}
          required
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.legalName = e.target.value}
          error={!!errors.legalName}
          helperText={errors.legalName}
        />
        <Dropdown
          label="Users"
          key={'users'}
          value={form.users}
          onChange={e => {
            form.users = e.target.value
          }}
          options={allUsers}
          onBlur = {() => {
            if(form.users.length === 0) {
              setErrors(errors => ({...errors, 'userTypes': 'This field is required'}));
            } else {
              setErrors(errors => ({...errors, 'userTypes': null}));
            }
          }
          }
          error={!!errors.users}
          helperText={errors.users}
          // sx={{mb: 2}}
          noEmpty
          required = {true}
        />
        <SelectField
        key={'administrator'}
        label={'Organization Administrator'}
        value={form.administrator}
        options={allUsers}
        error={!!errors.administrator}
        helperText={errors.administrator}
        onChange={e => {
          form.administrator = e.target.administrator
        }}
        />
        <GeneralField
          key={'comment'}
          label={'Comment'}
          value={form.comment}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.comment = e.target.value}
          error={!!errors.comment}
          helperText={errors.comment}
        />

        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>

        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'add' ? 'Are you sure you want to create this new Organization?' :
                       'Are you sure you want to update this Organization?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>
    </Container>);

}