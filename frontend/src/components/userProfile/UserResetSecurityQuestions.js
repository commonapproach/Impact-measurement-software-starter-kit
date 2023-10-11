import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, { useEffect, useState, useContext } from 'react';
import {
  LoginCheckSecurityQuestion, updateSecurityQuestion,
} from "../../api/userApi";
import {getUserSecurityQuestionsLogin} from "../../api/auth";
import {Loading} from "../shared";
import {Button, Container, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {loginDoubleAuthFields} from "../../constants/login_double_auth_fields";
import { UserContext } from "../../context";
import GeneralField from "../shared/fields/GeneralField";
import {useSnackbar} from "notistack";
import {navigate, navigateHelper} from "../../helpers/navigatorHelper";

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
  const {id} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)

  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();

  const [state, setState] = useState({
    group: 1,
    checked: false,
    checkedQuestion: '',
    checkedAnswer: '',
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
      if(state.checked){
        const {success, message} = await updateSecurityQuestion(id, {form, checkedAnswer: state.checkedAnswer, checkedQuestion: state.checkedQuestion, email: state.email})

        if(success){
          setState(state => ({...state, loadingButton: false}))
          navigate('/profile/' + id)
          enqueueSnackbar(message || 'Success!', {variant: 'success'})
        }
      }else if(state.group < 4){
        const group = 'group' + state.group
        const securityQuestionAnswer = 'securityQuestionAnswer' + state.group
        const answer = form[group][securityQuestionAnswer]
        const securityQuestion = 'securityQuestion' + state.group
        const question = form[group][securityQuestion]

        const {success, message, matched} = await LoginCheckSecurityQuestion({email: state.email,
          question, answer})

        if(matched){
          setForm(form => ({...form, [group]: {...form[group], [securityQuestionAnswer]: ''}}))
          setState(state => ({...state, loadingButton: false, checked: true, checkedAnswer: answer, checkedQuestion: question}))

        }else{
          setForm(form => ({...form, [group]: {...form[group], [securityQuestionAnswer]: ''}}))
          setState(state => ({...state, group: state.group + 1, loadingButton: false}))
        }
      }
    }catch (e){
      if (e.json) {
        setState(state => ({...state, loadingButton: false}))
        enqueueSnackbar(e.json?.message || 'Error occurs', {variant: 'error'})
      }
    }
  }

  if(loading)
    return <Loading message={`Loading`}/>

  if(state.checked)
    return (<Container className={classes.root}>
      <Typography variant="h5">
        {'Please reset your security Question'}
      </Typography>
      {Object.entries(form).map((group, index) => {
        console.log(group[1])
        console.log(`securityQuestion${index + 1}`)
        console.log(form[`group${index + 1}`][`securityQuestion${index + 1}`])
        return (
          <div>
            <GeneralField
              label={`Question ${index + 1}`}
              key={`Question${index + 1}`}
              value={group[1][`securityQuestion${index + 1}`]}
              required
              onChange={e => {
                form[`group${index + 1}`][`securityQuestion${index + 1}`] = e.target.value
              }}
            />

            <GeneralField
              key={`Answer${index + 1}`}
              label={`Answer ${index + 1}`}
              value={group[1][`securityQuestionAnswer${index + 1}`]}
              required
              onChange={e => {
                form[`group${index + 1}`][`securityQuestionAnswer${index + 1}`] = e.target.value
              }}
            />
          </div>
          )
      })}
      <LoadingButton noDefaultStyle variant="contained" color="primary" loading ={state.loadingButton} className={classes.button}
                     onClick={handleSubmit}/>
    </Container>)


  const group = 'group' + state.group

  if(state.group === 1)
    return (<Container className={classes.root}>
      <Typography variant="h5">
        {'Please answer the security question.'}
      </Typography>

      {Object.entries(loginDoubleAuthFields[group]).map(([field, option]) => {
        return (
          <option.component
            key={field}
            label={option.label}
            type={option.type}
            value={form[group][field]}
            required={option.required}
            onChange={e => form[group][field] = e.target.value}
            disabled={option.disabled}
            error={!!state.errors[group][field]}
            helperText={state.errors[group][field]}
          />)

      }
      )}
      <LoadingButton noDefaultStyle variant="contained" color="primary" loading ={state.loadingButton} className={classes.button}
                     onClick={handleSubmit}/>
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
        <LoadingButton noDefaultStyle variant="contained" color="primary" loading ={state.loadingButton} className={classes.button}
                       onClick={handleSubmit}/>
      </Container>)
  }
}