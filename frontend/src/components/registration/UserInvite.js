import React, {useEffect, useState, useContext} from 'react';
import {useNavigate, useParams} from "react-router-dom";

import {defaultInvitationFields} from "../../constants/default_fields";
import {Button, Container, Typography} from "@mui/material";
import {makeStyles} from "@mui/styles";
import {superuserInvitationFields, } from "../../constants/userInvitationFields";
import {createUser} from "../../api/userApi";
import {Loading} from "../shared"
import {AlertDialog} from "../shared/Dialogs"
import {isFieldEmpty} from "../../helpers";
import {REQUIRED_HELPER_TEXT} from "../../constants";
import LoadingButton from "../shared/LoadingButton";
import {UserContext} from "../../context";
import {fetchUserTypes} from "../../api/userTypesApi";
import Dropdown from "../shared/fields/MultiSelectField";
import { useSnackbar } from 'notistack';


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
      ...defaultInvitationFields
    },
    errors: {},
    dialog: false,
    // loading: false,
    loadingButton: false
  });

  const [userTypes, setUserTypes] = useState({

})

  useEffect(()=>{
    fetchUserTypes().then(({userTypes})=>{
      setUserTypes(userTypes);
    })
  },[]);

  /**
   * @returns {boolean} true if valid.
   */
  const validate = () => {
    const errors = {};
    if(state.form.userTypes.length === 0)
      errors.userTypes = 'This field is required';
    for (const [field, option] of Object.entries(superuserInvitationFields)) {
      const isEmpty = isFieldEmpty(state.form[field]);
      if (option.required && isEmpty) {
        errors[field] = REQUIRED_HELPER_TEXT;
      }
      let msg;
      if (!isEmpty && option.validator && (msg = option.validator(state.form[field]))) {
        errors[field] = msg;
      }
    }
    if (Object.keys(errors).length !== 0) {
      setState(state => ({...state, errors}));
      return false
    }
    return true;
  };

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, dialog: true}))
    }
  }

  const handleCancel = () => {
    setState(state => ({...state, dialog: false}))
  }

  const handleConfirm = async () => {

    console.log('valid')
    try {
      setState(state => ({...state, loadingButton: true }))
      const {success, message} = await createUser({form: state.form});
      setState(state => ({...state, loadingButton: false, dialog: false}))
      navigate('/dashboard');
      enqueueSnackbar(message, {variant: 'success'});

    } catch (e) {
      setState(state => ({...state, errors: e.json, loadingButton: false, dialog: false}))
      enqueueSnackbar(state.errors.message || "Error occur", {variant: 'error'})
    }

  };

  const handleOnBlur = (field, option) => {

    if (!isFieldEmpty(state.form[field]) && option.validator && !!option.validator(state.form[field]))
      // state.errors.field = option.validator(e.target.value)
      setState(state => ({...state, errors: {...state.errors, [field]: option.validator(state.form[field])}}))
    //console.log(state.errors)
    else {
      setState(state => ({...state, errors: {...state.errors, [field]: undefined}}))
    }

  };



  return (
    <Container className={classes.root}>
      <Typography variant="h5">
        {'Create new user'}
      </Typography>

      <Dropdown
        label="User Type"
        key={'userTypes'}
        value={state.form.userTypes}
        onChange={e => {
          state.form.userTypes = e.target.value
        }}
        options={userTypes}
        onBlur = {() => {
          if(state.form.userTypes.length === 0) {
            setState(state => ({...state, errors: {...state.errors, 'userTypes': 'This field is required'}}))
          } else {
            setState(state => ({...state, errors: {...state.errors, 'userTypes': null}}))
          }
        }
        }
        error={!!state.errors.userTypes}
        helperText={state.errors.userTypes}
        // sx={{mb: 2}}
        noEmpty
        required = {true}
      />

      {Object.entries(superuserInvitationFields).map(([field, option]) => {

        return (

          <option.component
            key={field}
            label={option.label}
            type={option.type}
            options={option.options}
            value={state.form[field]}
            required={option.required}
            onChange={e => state.form[field] = e.target.value}
            onBlur={() => handleOnBlur(field, option)}
            error={!!state.errors[field]}
            helperText={state.errors[field]}
          />
        )
      })}
      <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
        Submit
      </Button>
      <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                   dialogTitle={'Are you sure you want to submit?'}
                   buttons={[<Button onClick={handleCancel} key={'cancel'}>{'cancel'}</Button>,
                     // <Button onClick={handleConfirm} key={'confirm'} autoFocus> {'confirm'}</Button>,
                     <LoadingButton noDefaultStyle variant="text" color="primary" loading ={state.loadingButton} key={'confirm'}
                                    onClick={handleConfirm} children='confirm' autoFocus/>]}
                   open={state.dialog}/>
      {/*<AlertDialog dialogContentText={"A registration link has been sent to the user."}*/}
      {/*             dialogTitle={'Success'}*/}
      {/*             buttons={[<Button onClick={() => navigate('/dashboard')} key={'ok'}>{'ok'}</Button>]}*/}
      {/*             open={state.success}/>*/}
      {/*<AlertDialog dialogContentText={state.errors.message||"Error occur"}*/}
      {/*             dialogTitle={'Fail'}*/}
      {/*             buttons={[<Button onClick={() => navigate('/dashboard')} key={'ok'}>{'ok'}</Button>]}*/}
      {/*             open={state.fail}/>*/}



    </Container>
  )
}