import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {
  fetchOrganizations,
  fetchOrganizationsBasedOnGroup,
} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {fetchGroups} from "../../api/groupApi";
import {Undo} from "@mui/icons-material";
import {fetchIndicators} from "../../api/indicatorApi";
import {fetchOutcomes} from "../../api/outcomeApi";

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


export default function OutcomeReports() {

  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();
  const mode = '';

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );


  // const [groups, setGroups] = useState({});
  // const [selectedGroup, setSelectedGroup] = useState('');
  const [organizations, setOrganizations] = useState({});
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);


  // useEffect(() => {
  //   fetchGroups().then(res => {
  //     if (res.success) {
  //       const groups = {};
  //       res.groups.map(group => {
  //         groups[group._uri] = group.label;
  //       });
  //       setGroups(groups);
  //       setLoading(false);
  //     }
  //   });
  // }, []);

  useEffect(() => {
    fetchOrganizations().then(({organizations, success}) => {
      if (success) {
        const organizationsOps = {};
        organizations.map(organization => {
          organizationsOps[organization._uri] = organization.legalName;
        });
        setOrganizations(organizationsOps);
        setLoading(false);
      }
    });


  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchOutcomes(encodeURIComponent(selectedOrganization)).then(({success, outcomes}) => {
        if (success) {
          setOutcomes(outcomes);
        }
      });
    }
  }, [selectedOrganization]);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Outcomes </Typography>

        <SelectField
          key={'organization'}
          label={'Organization'}
          value={selectedOrganization}
          options={organizations}
          // error={!!errors.group}
          // helperText={
          //   errors.group
          // }
          onChange={e => {
            setSelectedOrganization(
              e.target.value
            );
          }}
        />
        {outcomes.length ? outcomes.map((outcome, index) => {
          return (
            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'subtitle1'}> {`Outcome: ${outcome.name}`}  </Typography>
              <Typography variant={'body1'}> {'Name: '}<Link to={`/outcome/${encodeURIComponent(outcome._uri)}/view`} color={'blue'}>{outcome.name}</Link> </Typography>
              {outcome.indicators?
                <Paper elevation={0} sx={{p: 1}}>
                <Typography variant={'subtitle2'}> {`Indicators:`}  </Typography>
                  {outcome.indicators.map(indicator => {
                    return (
                      <Paper elevation={0}>
                        <Typography variant={'body2'}> {`Indicator Name: `}<Link to={`/indicator/${encodeURIComponent(indicator._uri)}/view`} color={'blue'}>{indicator.name}</Link> </Typography>
                        <Typography variant={'body2'}> {`Unit of Measure: ${indicator.unitOfMeasure.label}`} </Typography>
                        <Paper elevation={0} sx={{p:1}}>
                          {indicator.indicatorReports?
                            <Paper elevation={0}>
                              <Typography variant={'body2'}> {`Indicator Reports`} </Typography>
                              {indicator.indicatorReports.map(indicatorReport =>
                                <Typography variant={'body2'}> {`Indicator Report: `}<Link
                                  to={`/indicatorReport/${encodeURIComponent(indicatorReport._uri)}/view`}
                                  color={'blue'}>{indicatorReport.name}</Link> </Typography>
                              )}
                            </Paper>
                            :null
                          }
                        </Paper>
                      </Paper>)
                  })}
                </Paper> : null}


            </Paper>

          );
        }) : null}


        {/*<AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}*/}
        {/*             dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Organization?' :*/}
        {/*               'Are you sure you want to update this Organization?'}*/}
        {/*             buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}*/}
        {/*                               key={'cancel'}>{'cancel'}</Button>,*/}
        {/*               <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}*/}
        {/*                              key={'confirm'}*/}
        {/*                              onClick={handleConfirm()} children="confirm" autoFocus/>]}*/}
        {/*             open={state.submitDialog}/>*/}
      </Paper>


      {outcomes.length ?
        <Paper sx={{p: 1}}>
          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
          }}>
            Generate PDF File
          </Button>
        </Paper> :
        null}

      <Paper sx={{p: 1}}>
        <Button variant="contained" color="primary" className={classes.button} onClick={() => {
          navigate('/reportGenerate');
        }} startIcon={<Undo/>}>
          Back
        </Button>
      </Paper>

    </Container>
  );

}