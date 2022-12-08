import {makeStyles} from "@mui/styles";
import {useNavigate} from "react-router-dom";
import React, { useEffect, useState, useContext } from 'react';
import {
  LoginCheckSecurityQuestion,
} from "../../api/userApi";
import {getUserSecurityQuestionsLogin} from "../../api/auth";
import {Loading} from "../shared";
import {Button, Container, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {loginDoubleAuthFields} from "../../constants/login_double_auth_fields";
import { UserContext } from "../../context";

const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 12,
  }
}));



export default function DoubleAuth() {
  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);

  const [state, setState] = useState({
    group: 1,
    password: '',
    errors: {
      group1: {},
      group2: {},
      group3: {},
    },
    email: '',
    loadingButton: false,
  });
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if(state.group === 4){
      setState(state => ({...state, group: 1}))
    }
  },[state.group])

  const [form, setForm] = useState({
    group1: {securityQuestion1: '', securityQuestionAnswer1: ''},
    group2: {securityQuestion2: '', securityQuestionAnswer2: ''},
    group3: {securityQuestion3: '', securityQuestionAnswer3: ''},
  })
  useEffect(() => {
    getUserSecurityQuestionsLogin().then(response => {
      if (response.success){
        const securityQuestions = response.data.securityQuestions
        form.group1.securityQuestion1 = securityQuestions.splice(Math.floor(Math.random() * securityQuestions.length), 1)[0]
        form.group2.securityQuestion2 = securityQuestions.splice(Math.floor(Math.random() * securityQuestions.length), 1)[0]
        form.group3.securityQuestion3 = securityQuestions.splice(Math.floor(Math.random() * securityQuestions.length), 1)[0]
        setState(state => ({...state, email: response.data.email}));
        setLoading(false);
      }
    }).catch(e =>{
      console.log(e)
      if(e.json){
        setState(state => ({...state, errors: e.json, errorDialog: true, loading: false}))
      }
    });
  }, []);

  const handleSubmit = async () => {
    setState(state => ({...state, loadingButton: true}))
    try{
      if(state.group < 4){
        const group = 'group' + state.group
        const securityQuestionAnswer = 'securityQuestionAnswer' + state.group
        const answer = form[group][securityQuestionAnswer]
        const securityQuestion = 'securityQuestion' + state.group

        const {success, message, matched} = await LoginCheckSecurityQuestion({email: state.email,
          question: form[group][securityQuestion], answer})

        if(matched){

          setState(state => ({...state, loadingButton: false}))

        }else{
          setForm(form => ({...form, [group]: {...form[group], [securityQuestionAnswer]: ''}}))
          setState(state => ({...state, group: state.group + 1, loadingButton: false}))
        }
      }
    }catch (e){
      if (e.json) {
        setState(state => ({...state, errors: e.json, errorDialog: true, loadingButton: false}))
      }
    }
  }

  if(loading)
    return <Loading message={`Loading`}/>

  const group = 'group' + state.group

  if(state.group === 1)
    return (<Container className={classes.root}>
      <Typography variant="h5">
        {'Please input your password'}
      </Typography>

      {Object.entries(loginDoubleAuthFields[group]).map(([field, option]) => {
        console.log(option, field)
        return (


          <option.component
            key={field}
            label={option.label}
            type={option.type}
            options={option.options}
            value={form[group][field]}
            required={option.required}
            onChange={e => form[group][field] = e.target.value}
            disabled={option.disabled}
            error={!!state.errors[group][field]}
            helperText={state.errors[group][field]}
          />)

      }
      )}
      {/*<Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>*/}
      {/*  Submit*/}
      {/*</Button>*/}
      <LoadingButton noDefaultStyle variant="contained" color="primary" loading ={state.loadingButton} className={classes.button}
                     onClick={handleSubmit}/>
      {/*<AlertDialog dialogContentText={'A link has been sent to your email address. Please follow it to reset your password'}*/}
      {/*             dialogTitle={'Success'}*/}
      {/*             buttons={[<Button onClick={() => navigate('/')} key={'ok'}>{'ok'}</Button>]}*/}
      {/*             open={state.successDialog}/>*/}
    </Container>)


  if(state.group < 4) {
    return (
      <Container className={classes.root}>
        <Typography variant="h5">
          {'Please answer security question'}
        </Typography>

        {Object.entries(loginDoubleAuthFields[group]).map(([field, option]) => {

          return (

            <option.component
              key={field}
              label={option.label}
              type={option.type}
              options={option.options}
              value={form[group][field]}
              required={option.required}
              onChange={e => form[group][field] = e.target.value}
              disabled={option.disabled}
              error={!!state.errors[group][field]}
              helperText={state.errors[group][field]}
            />
          )
        })}
        {/*<Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>*/}
        {/*  Submit*/}
        {/*</Button>*/}
        <LoadingButton noDefaultStyle variant="contained" color="primary" loading ={state.loadingButton} className={classes.button}
                       onClick={handleSubmit}/>
        {/*<AlertDialog dialogContentText={state.errors.message||"Error occur"}*/}
        {/*             dialogTitle={'Error'}*/}
        {/*             buttons={[<Button onClick={() => navigate('/')} key={'ok'}>{'ok'}</Button>]}*/}
        {/*             open={state.errorDialog}/>*/}
        {/*<AlertDialog dialogContentText={'A link has been sent to your email address. Please follow it to reset your password'}*/}
        {/*             dialogTitle={'Success'}*/}
        {/*             buttons={[<Button onClick={() => navigate('/')} key={'ok'}>{'ok'}</Button>]}*/}
        {/*             open={state.successDialog}/>*/}
      </Container>)
  }
}