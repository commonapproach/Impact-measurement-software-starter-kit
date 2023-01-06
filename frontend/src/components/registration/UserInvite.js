import React, {useEffect, useState, useContext} from 'react';
import {useNavigate,} from "react-router-dom";

import {Button, Container, Typography} from "@mui/material";
import {makeStyles} from "@mui/styles";
import {createUser} from "../../api/userApi";
import {Loading} from "../shared";
import {AlertDialog} from "../shared/Dialogs";
import {verifyEmail} from "../../helpers";
import LoadingButton from "../shared/LoadingButton";
import {UserContext} from "../../context";
import {fetchUserTypes} from "../../api/userTypesApi";
import Dropdown from "../shared/fields/MultiSelectField";
import {useSnackbar} from 'notistack';
import GeneralField from "../shared/fields/GeneralField";


const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 12,
  }
}));

export default function UserInvite() {
  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();
  const [state, setState] = useState({
    form: {
      userTypes: [],
      email: '',
      firstName: '',
      lastName: '',
      middleName: ''
    },
    errors: {},
    dialog: false,
    loading: true,
    loadingButton: false
  });

  const [userTypes, setUserTypes] = useState({});

  useEffect(() => {
    fetchUserTypes().then(({userTypes}) => {
      setUserTypes(userTypes);
      setState(state => ({...state, loading: false}));
    }).catch(e => {
      setState(state => ({...state, errors: e.json}));
      navigate('/dashboard');
      enqueueSnackbar('Fail to fetch userTypes', {variant: 'error'});
    });
  }, []);

  /**
   * @returns {boolean} true if valid.
   */
  const validate = () => {
    const errors = {};
    if (state.form.userTypes.length === 0)
      errors.userTypes = 'This field is required';
    verifyEmail(state.form.email, 'email', errors);
    if(!state.form.firstName)
      errors.firstName = 'This field is required';
    if(!state.form.lastName)
      errors.lastName = 'This field is required';

    if (Object.keys(errors).length !== 0) {
      setState(state => ({...state, errors}));
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, dialog: true}));
    }
  };

  const handleCancel = () => {
    setState(state => ({...state, dialog: false}));
  };

  const handleConfirm = async () => {

    console.log('valid');
    try {
      setState(state => ({...state, loadingButton: true}));
      const {success, message} = await createUser({form: state.form});
      setState(state => ({...state, loadingButton: false, dialog: false}));
      navigate('/users');
      enqueueSnackbar(message, {variant: 'success'});

    } catch (e) {
      setState(state => ({...state, errors: e.json, loadingButton: false, dialog: false}));
      enqueueSnackbar(state.errors.message || "Error occur", {variant: 'error'});
    }

  };


  if (state.loading)
    return <Loading message={'Fetching UserTypes'}/>;

  return (
    <Container className={classes.root}>
      <Typography variant="h5">
        {'Create new user'}
      </Typography>

      <Dropdown
        label="User Types"
        key={'userTypes'}
        value={state.form.userTypes}
        onChange={e => {
          state.form.userTypes = e.target.value;
        }}
        options={userTypes}
        onBlur={() => {
          if (state.form.userTypes.length === 0) {
            setState(state => ({...state, errors: {...state.errors, 'userTypes': 'This field is required'}}));
          } else {
            setState(state => ({...state, errors: {...state.errors, 'userTypes': null}}));
          }
        }
        }
        error={!!state.errors.userTypes}
        helperText={state.errors.userTypes}
        // sx={{mb: 2}}
        noEmpty
        required={true}
      />

      <GeneralField
        key={'email'}
        label={'Email'}
        type={'email'}
        value={state.form.email}
        required
        onChange={e => state.form.email = e.target.value}
        onBlur={() => {
          const correct = verifyEmail(state.form.email, 'email', state.errors)
          if(correct){
            setState(state => ({...state, errors: {...state.errors, email: correct}}))
          } else {
            setState(state => ({...state, errors: {...state.errors, email: undefined}}))
          }
        }}
        error={!!state.errors.email}
        helperText={state.errors.email}
      />
      <GeneralField
        key={'firstName'}
        label={'First Name'}
        value={state.form.firstName}
        required
        onChange={e => state.form.firstName = e.target.value}
        onBlur={() => {
          if(!state.form.firstName){
            setState(state => ({...state, errors: {...state.errors, firstName: 'First name is required'}}))
          } else {
            setState(state => ({...state, errors: {...state.errors, firstName: undefined}}))
          }
        }}
        error={!!state.errors.firstName}
        helperText={state.errors.firstName}
      />
      <GeneralField
        key={'lastName'}
        label={'Last Name'}
        value={state.form.lastName}
        required
        onChange={e => state.form.lastName = e.target.value}
        onBlur={() => {
          if(!state.form.lastName){
            setState(state => ({...state, errors: {...state.errors, lastName: 'First name is required'}}))
          } else {
            setState(state => ({...state, errors: {...state.errors, lastName: undefined}}))
          }
        }}
        error={!!state.errors.lastName}
        helperText={state.errors.lastName}
      />
      <GeneralField
        key={'middleName'}
        label={'Middle Name'}
        value={state.form.middleName}
        onChange={e => state.form.middleName = e.target.value}
        error={!!state.errors.middleName}
        helperText={state.errors.middleName}
      />
      <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
        Submit
      </Button>
      <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                   dialogTitle={'Are you sure you want to submit?'}
                   buttons={[<Button onClick={handleCancel} key={'cancel'}>{'cancel'}</Button>,
                     // <Button onClick={handleConfirm} key={'confirm'} autoFocus> {'confirm'}</Button>,
                     <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                    key={'confirm'}
                                    onClick={handleConfirm} children="confirm" autoFocus/>]}
                   open={state.dialog}/>


    </Container>
  );
}