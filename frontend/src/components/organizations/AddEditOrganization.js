import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {
  createOrganization,
  fetchOrganization,
  fetchOrganizations,
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


export default function AddEditOrganization() {

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
    legalName: '',
    organizationNumber: '',
    issuedBy: '',
    administrator: '',
    reporters: [],
    editors: [],
    researchers: [],
    comment: '',
    contactName: '',
    email: '',
    telephone: '',
    uri: '',
    organizationIds: [{organizationId: '', issuedBy: ''}]
  });
  // const [outcomeForm, setOutcomeForm] = useState([
  // ]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    objectForm: {},
    issuedBy: {}
  });


  useEffect(() => {

    Promise.all([
      fetchOrganizationsInterfaces().then(({organizations, success}) => {
        if (success) {
          const orgDict = {};
          organizations.map(org => {
            if (org._uri !== uri)
              orgDict[org._uri] = org.legalName;
          });
          setOptions(options => ({...options, issuedBy: orgDict}))
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
          fetchOrganization(encodeURIComponent(uri)).then(res => {
            if (res.success) {
              const {organization} = res;
              setForm({
                legalName: organization.legalName || '',
                organizationNumber: organization.organizationNumber || '',
                issuedBy: organization.issuedBy || '',
                administrator: organization.administrator || '',
                reporters: organization.reporters || [],
                editors: organization.editors || [],
                researchers: organization.researchers || [],
                comment: organization.comment || '',
                contactName: organization.contactName || '',
                email: organization.email || '',
                telephone: organization.telephone?
                  `+${organization.telephone.countryCode} (${String(organization.telephone.phoneNumber).slice(0, 3)}) ${String(organization.telephone.phoneNumber).slice(3, 6)}-${String(organization.telephone.phoneNumber).slice(6, 10)}` :
                  '',
                uri: organization._uri || '',
                issuedByName: organization.issuedByName,
                administratorName: organization.administratorName,
                reporterNames:organization.reporterNames,
                researcherNames: organization.researcherNames,
                editorNames: organization.editorNames,
                organizationIds: organization.hasIds?.map(organizationId => ({organizationId: organizationId.hasIdentifier, issuedBy: mode === 'view'? organizationId.issuedBy:organizationId.issuedBy._uri, _uri: organizationId._uri})) || []
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
      if (form.telephone) {
        form.countryCode = 1;
        form.areaCode = Number(form.telephone.match(/\(\d{3}\)/)[0].match(/\d{3}/)[0]);
        form.phoneNumber = Number(form.telephone.split('(')[1].split(') ')[0] +
          form.telephone.split('(')[1].split(') ')[1].split('-')[0] +
          form.telephone.split('(')[1].split(') ')[1].split('-')[1]);
      }
      createOrganization({form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organizations');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating organization', {variant: "error"});
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
      updateOrganization(encodeURIComponent(uri), {form},).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organizations');
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
    if (!form.legalName) {
      error.legalName = 'The field cannot be empty';
    }
    // form.organizationIds.map(({organizationId, issuedBy}, index) => {
    //   if (!organizationId) {
    //     if (!error.organizationIds)
    //       error.organizationIds = {};
    //     error.organizationIds[index].organizationId = 'The field is required'
    //   }
    //   if (!issuedBy) {
    //     if (!error.organizationIds)
    //       error.organizationIds = {};
    //     error.organizationIds[index].issuedBy = 'The field is required'
    //   }
    // })
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
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          {form.organizationIds.length? <Typography variant={'h6'}> {`Organization IDs:`} </Typography>:null}
          {form.organizationIds.map(organizationId => {

            return (
              <Paper elevation={0}>
                <Typography variant={'body1'}> {`ID: ${organizationId.organizationId}`}</Typography>
                <Typography variant={'body1'}> Issued By: <Link to={`/organizations/${encodeURIComponent(organizationId.issuedBy._uri)}/view`} colorWithHover color={'#2f5ac7'}>{organizationId.issuedBy.legalName}</Link></Typography>
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
        <Typography variant={'h4'}> Organization Basic </Typography>
        <GeneralField
          disabled={!userContext.isSuperuser}
          key={'legalName'}
          label={'Organization Legal Name'}
          value={form.legalName}
          required
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.legalName = e.target.value}
          error={!!errors.legalName}
          helperText={errors.legalName}
          onBlur={() => {
            if (form.legalName === '') {
              setErrors(errors => ({...errors, legalName: 'This field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, legalName: ''}));
            }

          }}
        />

        <GeneralField
          disabled={mode === 'edit'}
          key={'uri'}
          label={'URI'}
          value={form.uri}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.uri = e.target.value}
          error={!!errors.uri}
          helperText={errors.uri}
          onBlur={() => {
            if (form.uri !== '' && !isValidURL(form.uri)){
              setErrors(errors => ({...errors, uri: 'Please input an valid URI'}));
            } else {
              setErrors(errors => ({...errors, uri: ''}));
            }

          }}
        />


        <GeneralField
          disabled={!userContext.isSuperuser}
          key={'telephone'}
          label={'Telephone'}
          type={'phoneNumber'}
          value={form.telephone}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.telephone = e.target.value}
          error={!!errors.telephone}
          helperText={errors.telephone}
          // onBlur={() => {
          //   if (form.ID === '') {
          //     setErrors(errors => ({...errors, ID: 'This field cannot be empty'}));
          //   } else {
          //     setErrors(errors => ({...errors, ID: ''}));
          //   }
          // }}
        />

        <GeneralField
          disabled={!userContext.isSuperuser}
          key={'email'}
          label={'Contact Email'}
          value={form.email}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.email = e.target.value}
          error={!!errors.email}
          helperText={errors.email}
          // onBlur={() => {
          //   if (form.ID === '') {
          //     setErrors(errors => ({...errors, ID: 'This field cannot be empty'}));
          //   } else {
          //     setErrors(errors => ({...errors, ID: ''}));
          //   }
          // }}
        />

        <GeneralField
          disabled={!userContext.isSuperuser}
          key={'contactName'}
          label={'Contact Name'}
          value={form.contactName}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.contactName = e.target.value}
          error={!!errors.contactName}
          helperText={errors.contactName}
          // onBlur={() => {
          //   if (form.ID === '') {
          //     setErrors(errors => ({...errors, ID: 'This field cannot be empty'}));
          //   } else {
          //     setErrors(errors => ({...errors, ID: ''}));
          //   }
          // }}
        />

        <SelectField
          disabled={mode === 'new' || !userContext.isSuperuser}
          key={'administrator'}
          label={'Organization Administrator'}
          value={form.administrator}
          options={options.objectForm}
          error={!!errors.administrator}
          helperText={
            errors.administrator
          }
          onBlur={() => {
            if (!form.administrator) {
              setErrors(errors => ({...errors, administrator: 'This field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, administrator: ''}));
            }

          }}
          onChange={e => {
            setForm(form => ({
                ...form, administrator: e.target.value
              })
            );
          }}
        />
        <Dropdown
          label="Editors"
          key={'editors'}
          disabled={mode === 'new'}
          value={form.editors}
          onChange={e => {
            form.editors = e.target.value;
          }}
          options={options.objectForm}
          error={!!errors.editors}
          helperText={errors.editors}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Reporters"
          key={'reporters'}
          value={form.reporters}
          disabled={mode === 'new'}
          onChange={e => {
            form.reporters = e.target.value;
          }}
          options={options.objectForm}
          error={!!errors.reporters}
          helperText={errors.reporters}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Researcher"
          key={'researcher'}
          value={form.researchers}
          disabled={mode === 'new'}
          onChange={e => {
            form.researchers = e.target.value;
          }}
          options={options.objectForm}
          error={!!errors.researchers}
          helperText={errors.researchers}
          // sx={{mb: 2}}
        />
        <GeneralField
          key={'comment'}
          label={'Comment'}
          value={form.comment}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.comment = e.target.value}
          error={!!errors.comment}
          helperText={errors.comment}
          minRows={4}
          multiline
        />
          {form.organizationIds.length? <Typography variant={'h5'}>Organization ID</Typography>:null}
          {form.organizationIds.map(({organizationId, issuedBy}, index) => {
            return <Paper sx={{p: 0, position: 'relative' }} >
              <div sx={{position: 'relative' }}>
                {index ===  form.organizationIds.length - 1?
                  <Chip
                  variant="contained"
                  disabled={!userContext.isSuperuser || mode !== 'new'}
                  color="primary"
                  icon={<AddIcon/>}
                  label={'Add'}
                  onClick={() => {
                    const organizationIds = form.organizationIds
                    organizationIds.push({organizationId: '', issuedBy: ''});
                    setForm(form => ({...form, organizationIds: organizationIds}));
                    const organizationIdErrors = errors.organizationIds;
                    organizationIdErrors[index + 1] = {};
                    setErrors(errors => ({...errors, organizationIds: organizationIdErrors}));
                  }}
                  sx={{position: 'absolute', right:0, marginTop:10, backgroundColor:'#dda0dd', color:'white', width: '100px'}}
                />:null}
                {index === form.organizationIds.length - 1 && index !== 0?
                  <Chip
                  variant="contained"
                  disabled={!userContext.isSuperuser || mode !== 'new'}
                  color="primary"
                  // icon={<RemoveIcon/>}
                  label={'Remove'}
                  onDelete={() => {
                    const organizationIds = form.organizationIds;
                    organizationIds.pop();
                    setForm(form => ({...form, organizationIds: organizationIds}));
                    const organizationIdErrors = errors.organizationIds;
                    organizationIdErrors[index] = null;
                    setErrors(errors => ({...errors, organizationIds: organizationIdErrors}));
                  }}
                  sx={{position: 'absolute', right:0, marginTop:1.5, backgroundColor:'#dda0dd', color:'white', width: '100px'}}
                /> :null }


              </div>


              <GeneralField
                disabled={!userContext.isSuperuser || mode !== 'new'}
                key={'organizationId' + Math.random()}
                label={'Organization ID'}
                value={organizationId}
                sx={{mt: '16px', minWidth: 350}}
                onChange={e => {
                  form.organizationIds[index].organizationId = e.target.value;
                }}
                // error={!!errors.organizationIds[index].organizationId}
                // helperText={errors.organizationIds[index].organizationId}
                // onBlur={() => {
                //   const organizationIdErrors = errors.organizationIds;
                //   if (form.organizationIds[index].organizationId === '') {
                //     organizationIdErrors[index].organizationId = 'This field cannot be empty'
                //   } else {
                //     organizationIdErrors[index].organizationId = ''
                //   }
                //   setErrors(errors => ({...errors, organizationIds: organizationIdErrors}));
                // }}
              />


              <SelectField
                disabled={mode !== 'new' || !userContext.isSuperuser}
                key={'issuedBy' + Math.random()}
                label={'Number Issued By'}
                value={issuedBy}
                options={options.issuedBy}
                // error={!!errors.organizationIds[index].issuedBy}
                // helperText={
                //   errors.organizationIds[index].issuedBy
                // }
                // onBlur={() => {
                //   const organizationIdErrors = errors.organizationIds;
                //   if (form.organizationIds[index].issuedBy === '') {
                //     organizationIdErrors[index].issuedBy = 'This field cannot be empty'
                //   } else {
                //     organizationIdErrors[index].issuedBy = ''
                //   }
                //   setErrors(errors => ({...errors, organizationIds: organizationIdErrors}));
                // }}
                onChange={e => {
                  const ids = form.organizationIds;
                  ids[index].issuedBy = e.target.value
                  setForm(form => ({
                      ...form, organizationIds: ids
                    })
                  );
                }}
              />
            </Paper>
          })}



        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Organization?' :
                       'Are you sure you want to update this Organization?'}
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
            navigate(`/organizations/${encodeURIComponent(uri)}/edit`);
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