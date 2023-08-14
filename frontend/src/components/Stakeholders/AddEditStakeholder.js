import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {
  fetchOrganizationsInterfaces,
  updateOrganization
} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {Add as AddIcon, Remove as RemoveIcon} from "@mui/icons-material";
import {createStakeholder, fetchStakeholder, updateStakeholder} from "../../api/stakeholderAPI";

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


export default function AddEditStakeholder() {

  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {uri, viewMode} = useParams();
  const mode = uri ? viewMode : 'new';
  const {enqueueSnackbar} = useSnackbar();

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {
      organizationIds: {0: {}}
    }
  );


  const [form, setForm] = useState({
    organization: '',
    name: '',
    description: '',
    catchmentArea: ''
  })
  // const [outcomeForm, setOutcomeForm] = useState([
  // ]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    organizations: [],
    catchmentAreas: ['local', 'provincial', 'national', 'multinational', 'global']
  });


  useEffect(() => {

    Promise.all([
      fetchOrganizationsInterfaces().then(({organizations, success}) => {
        if (success) {
          const orgDict = {};
          organizations.map(org => {
            orgDict[org._uri] = org.legalName;
          });
          setOptions(options => ({...options, organizations: orgDict}))
        }
      }),
    ]).then(() => {
      if ((mode === 'edit' || mode === 'view') && uri) {
        Promise.all([
          fetchUsers(encodeURIComponent(uri)).then(({data, success}) => {
            const objectForm = {};
            data.map(user => {
              objectForm[user._uri] = `${user.person.givenName} ${user.person.familyName} URI: ${user._uri}`;
            });
            if (success)
              setOptions(options => ({...options, objectForm}));
          }),
          fetchStakeholder(encodeURIComponent(uri)).then(res => {
            if (res.success) {
              const {stakeholder} = res;
              setForm({
                name: stakeholder.name,
                description: stakeholder.description,
                catchmentArea: stakeholder.catchmentArea,
                legalName: stakeholder.legalName || '',
                organizationNumber: stakeholder.organizationNumber || '',
                issuedBy: stakeholder.issuedBy || '',
                administrator: stakeholder.administrator || '',
                reporters: stakeholder.reporters || [],
                editors: stakeholder.editors || [],
                researchers: stakeholder.researchers || [],
                comment: stakeholder.comment || '',
                contactName: stakeholder.contactName || '',
                email: stakeholder.email || '',
                telephone: stakeholder.telephone?
                  `+${stakeholder.telephone.countryCode} (${String(stakeholder.telephone.phoneNumber).slice(0, 3)}) ${String(stakeholder.telephone.phoneNumber).slice(3, 6)}-${String(stakeholder.telephone.phoneNumber).slice(6, 10)}` :
                  '',
                uri: stakeholder._uri || '',
                organization: stakeholder._uri,
                issuedByName: stakeholder.issuedByName,
                administratorName: stakeholder.administratorName,
                reporterNames:stakeholder.reporterNames,
                researcherNames: stakeholder.researcherNames,
                editorNames: stakeholder.editorNames,
                organizationIds: stakeholder.hasIds?.map(organizationId => ({organizationId: organizationId.hasIdentifier, issuedBy: mode === 'view'? organizationId.issuedBy:organizationId.issuedBy._uri, _uri: organizationId._uri})) || []
              });
              setLoading(false)
            }
          }).catch(e => {
            if (e.json)
              setErrors(e.json);
            console.log(e)
            setLoading(false);
            reportErrorToBackend(e);
            enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
          })
        ]);
      } else if ((mode === 'edit' || mode === 'view') && !uri) {
        navigate('/organizations');
        enqueueSnackbar("No URI provided", {variant: 'error'});
      } else {
        setLoading(false)
      }
    }).catch(e => {
      console.log(e)
      if (e.json)
        setErrors(e.json);
      reportErrorToBackend(e);
      setLoading(false);

      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });


  }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createStakeholder({form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/stakeholders');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating Stakeholder', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      if (form.telephone) {
        form.countryCode = 1;
        form.areaCode = Number(form.telephone.match(/\(\d{3}\)/)[0].match(/\d{3}/)[0]);
        form.phoneNumber = Number(form.telephone.split('(')[1].split(') ')[0] +
          form.telephone.split('(')[1].split(') ')[1].split('-')[0] +
          form.telephone.split('(')[1].split(') ')[1].split('-')[1]);
      }
      updateStakeholder(encodeURIComponent(uri), {form},).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/stakeholders');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e)
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const error = {};
    if (!form.name) {
      error.name = 'The field cannot be empty';
    }
    if (!form.organization) {
      error.organization = 'The field cannot be empty'
    }
    if (!form.catchmentArea) {
      error.catchmentArea = 'The field cannot be empty'
    }
    if (!form.description) {
      error.description = 'The field cannot be empty'
    }
    setErrors(error);

    return Object.keys(error).length === 0;
    // && outcomeFormErrors.length === 0 && indicatorFormErrors.length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view'?
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h6'}> {`Legal Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.legalName}`} </Typography>
          <Typography variant={'h6'}> {`Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.name}`} </Typography>
          <Typography variant={'h6'}> {`Description:`} </Typography>
          <Typography variant={'body1'}> {`${form.description}`} </Typography>
          <Typography variant={'h6'}> {`Catchment Area:`} </Typography>
          <Typography variant={'body1'}> {`${form.catchmentArea}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          {form.organizationIds.length? <Typography variant={'h6'}> {`Organization IDs:`} </Typography>:null}
          {form.organizationIds.map(organizationId => {
            return (
              <Paper elevation={0}>
                <Typography variant={'body1'}> {`ID: ${organizationId.organizationId}`}</Typography>
                <Typography variant={'body1'}> Issued By: <Link to={`/organization/${encodeURIComponent(organizationId.issuedBy._uri)}/view`} colorWithHover color={'#2f5ac7'}>{organizationId.issuedBy.legalName}</Link></Typography>
              </Paper>
            )
          })}
          {form.issuedBy? <Typography variant={'h6'}> {`Issued By:`} </Typography>:null}
          <Typography variant={'body1'}> <Link to={`/organization/${encodeURIComponent(form.issuedBy)}/view`} colorWithHover color={'#2f5ac7'}>{form.issuedByName}</Link> </Typography>
          {form.telephone? <Typography variant={'h6'}> {`Telephone:`} </Typography>:null}
          <Typography variant={'body1'}> {form.telephone} </Typography>
          {form.email? <Typography variant={'h6'}> {`Contact Email:`} </Typography>:null}
          <Typography variant={'body1'}> {form.email} </Typography>
          {form.contactName? <Typography variant={'h6'}> {`Contact Name:`} </Typography>:null}
          <Typography variant={'body1'}> {form.contactName} </Typography>
          {form.administrator? <Typography variant={'h6'}> {`Organization Administrator:`} </Typography>:null}
          <Typography variant={'body1'}> <Link to={`/organization/${encodeURIComponent(form.administrator)}/view`} colorWithHover color={'#2f5ac7'}>{form.administratorName}</Link> </Typography>
          {form.reporters.length? <Typography variant={'h6'}> {`Reporters:`} </Typography>:null}
          {form.reporters.map(reporterURI => {
            return (
              <Typography variant={'body1'}>
                <Link to={`/indicator/${encodeURIComponent(reporterURI)}/view`} colorWithHover
                      color={'#2f5ac7'}>{form.reporterNames[reporterURI]}</Link>
              </Typography>
            );
          })}
          {form.editors.length? <Typography variant={'h6'}> {`Editors:`} </Typography>:null}
          {form.editors.map(editorURI => {
            return (
              <Typography variant={'body1'}>
                <Link to={`/indicator/${encodeURIComponent(editorURI)}/view`} colorWithHover
                      color={'#2f5ac7'}>{form.editorNames[editorURI]}</Link>
              </Typography>
            );
          })}
          {form.researchers.length? <Typography variant={'h6'}> {`Researchers:`} </Typography>:null}
          {form.researchers.map(researcherURI => {
            return (
              <Typography variant={'body1'}>
                <Link to={`/indicator/${encodeURIComponent(researcherURI)}/view`} colorWithHover
                      color={'#2f5ac7'}>{form.researcherNames[researcherURI]}</Link>
              </Typography>
            );
          })}

        </Paper>
        : (<Paper sx={{p: 2, position: 'relative' }} variant={'outlined'}>
          <Typography variant={'h4'}> Stakeholder </Typography>
          <SelectField
            disabled={mode !== 'new'}
            key={'organization'}
            label={'Organization'}
            value={form.organization}
            options={options.organizations}
            error={!!errors.organization}
            helperText={
              errors.organization
            }
            onChange={e => {
              setForm(form => ({
                  ...form, organization: e.target.value
                })
              );
            }}
          />
          <GeneralField
            disabled={!userContext.isSuperuser}
            key={'name'}
            label={'Name'}
            value={form.name}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.name = e.target.value}
            error={!!errors.name}
            helperText={errors.name}
            // onBlur={() => {
            //   if (form.ID === '') {
            //     setErrors(errors => ({...errors, ID: 'This field cannot be empty'}));
            //   } else {
            //     setErrors(errors => ({...errors, ID: ''}));
            //   }
            // }}
          />
          <SelectField
            key={'catchment area'}
            label={'Catchment Area'}
            value={form.catchmentArea}
            options={options.catchmentAreas}
            onChange={e => {
              setForm(form => ({
                  ...form, catchmentArea: e.target.value
                })
              );
            }}
            error={!!errors.catchmentArea}
            helperText={errors.catchmentArea}
          />
          <GeneralField
            key={'description'}
            label={'Description'}
            value={form.description}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.description = e.target.value}
            error={!!errors.description}
            helperText={errors.description}
            minRows={4}
            multiline
          />


          <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                       dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Stakeholder?' :
                         'Are you sure you want to update this Stakeholder?'}
                       buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                         key={'cancel'}>{'cancel'}</Button>,
                         <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                        key={'confirm'}
                                        onClick={handleConfirm} children="confirm" autoFocus/>]}
                       open={state.submitDialog}/>
        </Paper>)}



      <Paper sx={{p: 2}} variant={'outlined'}>
        {mode === 'view'?
          <Button variant="contained" color="primary" className={classes.button} onClick={()=>{
            navigate(`/stakeholder/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>
          :
          <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
            Submit
          </Button> }

      </Paper>

    </Container>);

}