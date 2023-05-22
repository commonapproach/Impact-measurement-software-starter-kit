import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import {createIndicator, fetchIndicator, updateIndicator} from "../../api/indicatorApi";
import IndicatorField from "../shared/indicatorField";
import {reportErrorToBackend} from "../../api/errorReportApi";

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


export default function AddEditIndicator() {

  const classes = useStyles();
  const navigate = useNavigate();
  const {uri, orgUri, operationMode} = useParams();
  const mode = uri ? operationMode : 'new';
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
    // hasIdentifier: '',
    description: '',
    unitOfMeasure: '',
    uri: '',
    organizations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchIndicator(encodeURIComponent(uri)).then(({success, indicator}) => {
        if (success) {
          indicator.uri = indicator._uri;
          setForm(indicator);
          setLoading(false);
        }
      }).catch(e => {
        if (e.json)
          setErrors(e.json);
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (mode === 'edit' && (!uri || !orgUri)) {
      navigate('/organization-indicators');
      enqueueSnackbar("No ID or orgId provided", {variant: 'error'});
    } else if (mode === 'new' && !orgUri) {
      setLoading(false);
      // navigate('/organization-indicators');
      // enqueueSnackbar("No orgId provided", {variant: 'error'});
    } else if (mode === 'new' && orgUri) {
      setForm(form => ({...form, organizations: [orgUri]}));
      setLoading(false);
    } else {
      navigate('/organization-indicators');
      enqueueSnackbar('Wrong auth', {variant: 'error'});
    }

  }, [mode, uri]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createIndicator({form}, userContext).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organization-indicators');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e);
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && uri) {
      updateIndicator({form}, encodeURIComponent(uri)).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organization-indicators');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating indicator', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const error = {};
    if (form.name === '')
      error.name = 'The field cannot be empty';

    if (!form.description)
      error.description = 'The field cannot be empty';
    if (form.organizations.length === 0)
      error.organizations = 'The field cannot be empty';
    // if (!form.hasIdentifier)
    //   error.hasIdentifier = 'The field cannot be empty';
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Indicator </Typography>
        <IndicatorField
          disabled={mode === 'view'}
          disabledURI={mode !== 'new'}
          disabledOrganization={!!orgUri}
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