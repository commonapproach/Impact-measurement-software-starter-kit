import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import OutcomeField from "../shared/OutcomeField";
import {createOutcome, fetchOutcomeInterfaces, updateOutcome} from "../../api/outcomeApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {fetchStakeholderOutcome} from "../../api/stakeholderOutcomeAPI";
import {fetchStakeholderInterfaces} from "../../api/stakeholderAPI";
import {fetchCodesInterfaces} from "../../api/codeAPI";

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


export default function AddEditStakeholderOutcome() {

  const classes = useStyles();
  const navigate = useNavigate();
  const {uri, orgUri
    , operationMode} = useParams();
  const mode = uri? operationMode : 'new';
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  const [form, setForm] = useState({
    name: '',
    description: '',
    codes: [],
    stakeholder: '',
    uri: '',
    outcome: '',
    importance: '',
    inUnderserved: '',
    indicators: [],
    impactReports: []
  });
  const [dict, setDict] = useState({
    outcome: {},
    code:{},
    stakeholder: {}
  })
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      [
        fetchStakeholderInterfaces(), fetchCodesInterfaces(), fetchOutcomeInterfaces()
      ]
    ).then(([{stakeholderInterfaces}, {codesInterfaces}, {outcomeInterfaces}]) => {
      const dict = {}
      dict['outcome'] = outcomeInterfaces
      dict['stakeholder'] = stakeholderInterfaces
      dict['code'] = codesInterfaces
      console.log(dict)
      setDict(dict);
    }).catch(e=> {
      if (e.json) {
        setErrors(e.json);
      }
      console.log(e)
      enqueueSnackbar(e.json?.message || 'Error occurs when fetching interfaces', {variant: "error"});
      setState({loadingButton: false, submitDialog: false,});
    })
  }, [])

  useEffect(() => {
    if((mode === 'edit' && uri) || (mode === 'view' && uri)){
      fetchStakeholderOutcome(encodeURIComponent(uri)).then(({success, stakeholderOutcome}) => {
        if(success){
          console.log(stakeholderOutcome)
          stakeholderOutcome.uri = stakeholderOutcome._uri;
          setForm(stakeholderOutcome);
          setLoading(false)
        }
      }).catch(e => {
        if (e.json)
          setErrors(e.json);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching stakeholder outcome", {variant: 'error'});
      });
    } else if(mode === 'edit' && (!uri || !orgUri) ) {
      navigate(-1);
      enqueueSnackbar("No URI or orgUri provided", {variant: 'error'});
    } else if (mode === 'new' && !orgUri){
      setLoading(false);
      // navigate(-1);
      // enqueueSnackbar("No orgId provided", {variant: 'error'});
    }else if (mode === 'new' && orgUri) {
      setForm(form => ({...form, organizations: [orgUri]}))
      setLoading(false);
    } else {
      navigate(-1);
      enqueueSnackbar('Wrong auth', {variant: 'error'})
    }

  }, [mode, uri]);

  const handleSubmit = () => {
    if (validate()) {
      console.log(form)
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createOutcome({form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate(-1);
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e)
        enqueueSnackbar(e.json?.message || 'Error occurs when creating stakeholder Outcome', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && uri) {
      updateOutcome({form}, encodeURIComponent(uri)).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate(-1);
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        enqueueSnackbar(e.json?.message || 'Error occurs when updating outcome', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const error = {};
    if (!form.name)
      error.name = 'The field cannot be empty';
    if (!form.indicators.length)
      error.indicators = 'The field cannot be empty';
    // if (!form.themes.length)
    //   error.themes = 'The field cannot be empty';
    // if (!form.description)
    //   error.description = 'The field cannot be empty'
    if(!form.organization)
      error.organization = 'The field cannot be empty'
    if(form.uri && !isValidURL(form.uri))
      error.uri = 'Not a valid URI';
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view'?
        (
          <Paper sx={{p: 2}} variant={'outlined'}>

            <Typography variant={'h6'}> {`Name:`} </Typography>
            <Typography variant={'body1'}> {`${form.name}`} </Typography>
            <Typography variant={'h6'}> {`URI:`} </Typography>
            <Typography variant={'body1'}> {`${form.uri}`} </Typography>
            <Typography variant={'h6'}> {`Stakeholder:`} </Typography>
            <Typography variant={'body1'}> <Link to={`/stakeholder/${encodeURIComponent(form.stakeholder)}/view`} colorWithHover color={'#2f5ac7'}>{dict.stakeholder[form.stakeholder]}</Link> </Typography>
            <Typography variant={'h6'}> {`isUnderserved:`} </Typography>
            <Typography variant={'body1'}> {`${form.isUnderserved}`} </Typography>
            <Typography variant={'h6'}> {`Importance:`} </Typography>
            <Typography variant={'body1'}> {`${form.importance}`} </Typography>
            <Typography variant={'h6'}> {`Outcome:`} </Typography>
            <Typography variant={'body1'}> <Link to={`/outcome/${encodeURIComponent(form.outcome)}/view`} colorWithHover color={'#2f5ac7'}>{dict.outcome[form.outcome]}</Link> </Typography>

            {form.codes?.length? <Typography variant={'h6'}> {`Codes:`} </Typography>: null}
            {form.codes?.map(codeURI => {
              return (
                <Typography variant={'body1'}>
                  <Link to={`/code/${encodeURIComponent(codeURI)}/view`} colorWithHover
                        color={'#2f5ac7'}>{dict.code[codeURI]}</Link>
                </Typography>
              );
            })}
            {/*<Typography variant={'h6'}> {`Indicators:`} </Typography>*/}
            {/*{form.indicators.map(indicatorURI => {*/}
            {/*  return (*/}
            {/*    <Typography variant={'body1'}>*/}
            {/*      <Link to={`/indicator/${encodeURIComponent(indicatorURI)}/view`} colorWithHover*/}
            {/*            color={'#2f5ac7'}>{form.indicatorNames[indicatorURI]}</Link>*/}
            {/*    </Typography>*/}
            {/*  );*/}
            {/*})}*/}
            <Typography variant={'h6'}> {`Description:`} </Typography>
            <Typography variant={'body1'}> {`${form.description}`} </Typography>

            <Button variant="contained" color="primary" className={classes.button} onClick={()=>{
              navigate(`/outcome/${encodeURIComponent(uri)}/edit`);
            }
            }>
              Edit
            </Button>

          </Paper>
        )
        : (<Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Outcome </Typography>
          <OutcomeField
            disabled={mode === 'view'}
            disabledOrganization={!!orgUri}
            disableURI={mode !== 'new'}
            defaultValue={form}
            required
            onChange={(state) => {
              setForm(form => ({...form, ...state}));
            }}
            importErrors={errors}
          />

          {mode==='view'?
            <div/>:
            <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
              Submit
            </Button>}

          <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                       dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Outcome?' :
                         'Are you sure you want to update this outcome?'}
                       buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                         key={'cancel'}>{'cancel'}</Button>,
                         <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                        key={'confirm'}
                                        onClick={handleConfirm} children="confirm" autoFocus/>]}
                       open={state.submitDialog}/>
        </Paper>)}
    </Container>);

}