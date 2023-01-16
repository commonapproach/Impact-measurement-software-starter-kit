import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {createOrganization, fetchOrganization, updateOrganization} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import IndicatorField from "../shared/indicatorField";
import {fetchIndicators} from "../../api/indicatorApi";

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


export default function Indicators() {

  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {organizationId} = useParams();
  const {enqueueSnackbar} = useSnackbar();

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  const [form, setForm] = useState([{name: 'Luke', description: 'handsome'}]);

  const [loading, setLoading] = useState(true);


  const [trigger, setTrigger] = useState(false)

  useEffect(() => {
    fetchIndicators(organizationId, userContext.userTypes).then(({success, indicators}) => {
      if(success){
        setForm(indicators);
      }
    }).then(() => {
      setLoading(false)
    }).catch(e => {
      if (e.json)
        setErrors(e.json);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    })
  },[])

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    updateOrganization(id, {form, }, userContext.userTypes).then((res) => {
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
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Organization Basic</Typography>

        {form.map((indicator, index) => {
          return <IndicatorField
            importErrors={errors[index]}
            key={'indicator' + index}
            label={'indicator ' + (index + 1)}
            value={indicator}
            required
            onChange={(state) => {
              setForm(form => {
                form[index] = state;
                return form
              })
            }}
          />;
        })}




        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={'Are you sure you want to update this Organization?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>


        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={'Are you sure you want to update this Organization?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>



      <Paper sx={{p: 2}} variant={'outlined'}>
        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>
      </Paper>

    </Container>);

}