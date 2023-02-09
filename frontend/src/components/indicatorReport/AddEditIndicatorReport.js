import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import OutcomeField from "../shared/OutcomeField";
import {createOutcome, fetchOutcome, updateOutcome} from "../../api/outcomeApi";
import IndicatorReportField from "../shared/IndicatorReportField";
import {createIndicatorReport} from "../../api/indicatorReportApi";

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


export default function AddEditIndicatorReport() {

  const classes = useStyles();
  const navigate = useNavigate();
  const {id, orgId, operationMode} = useParams();
  const mode = id ? operationMode : 'new';
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
    comment: '',
    organization: null,
    indicator: null,
    numericalValue: '',
    unitOfMeasure: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ((mode === 'edit' && id) || (mode === 'view' && id)) {
      fetchOutcome(id, userContext).then(({success, outcome}) => {
        if (success) {
          setForm(outcome);
          setLoading(false);
        }
      }).catch(e => {
        if (e.json)
          setErrors(e.json);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (mode === 'edit' && (!id || !orgId)) {
      navigate(-1);
      enqueueSnackbar("No ID or orgId provided", {variant: 'error'});
    } else if (mode === 'new' && !orgId) {
      setLoading(false);
      // navigate(-1);
      // enqueueSnackbar("No orgId provided", {variant: 'error'});
    } else if (mode === 'new' && orgId) {
      setForm(form => ({...form, organizations: [orgId]}));
      setLoading(false);
    } else {
      navigate(-1);
      enqueueSnackbar('Wrong auth', {variant: 'error'});
    }

  }, [mode, id]);

  const handleSubmit = () => {
    if (validate()) {
      console.log(form);
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createIndicatorReport({form}, userContext).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate(-1);
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating indicator report', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && id) {
      updateOutcome({form}, id).then((res) => {
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
    console.log(form);
    const error = {};
    if (!form.name)
      error.name = 'The field cannot be empty';
    if (!form.comment)
      error.comment = 'The field cannot be empty';
    if (!form.organization)
      error.organization = 'The field cannot be empty';
    if (!form.indicator)
      error.indicator = 'The field cannot be empty';
    if (!form.startTime)
      error.startTime = 'The field cannot be empty';
    if (!form.endTime)
      error.endTime = 'The field cannot be empty';
    if (!form.numericalValue)
      error.numericalValue = 'The field cannot be empty';
    if (!form.unitOfMeasure)
      error.unitOfMeasure = 'The field cannot be empty';
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Indicator Report </Typography>
        <IndicatorReportField
          disabled={mode === 'view'}
          disabledOrganization={!!orgId}
          defaultValue={form}
          required
          onChange={(state) => {
            setForm(form => ({...form, ...state}));
          }}
          importErrors={errors}
        />

        {mode === 'view' ?
          <div/> :
          <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
            Submit
          </Button>}

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
    </Container>);

}