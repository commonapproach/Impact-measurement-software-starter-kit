import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {createOrganization, fetchOrganization, fetchOrganizations, updateOrganization} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";

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
  const {id} = useParams();
  const mode = id ? 'edit' : 'new';
  const {enqueueSnackbar} = useSnackbar();

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
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
    hasIdentifier: '',
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
      fetchUsers(id).then(({data, success}) => {
        const objectForm = {};
        data.map(user => {
          objectForm[user._id] = `${user.person.givenName} ${user.person.familyName} ID: ${user._id}`;
        });
        if (success)
          setOptions(options => ({...options, objectForm}));
      }),
      fetchOrganizations().then(({organizations, success}) => {
        if (success) {
          const orgDict = {};
          organizations.map(org => {
            if (org._id !== id)
              orgDict[org._id] = org.legalName;
          });
          setOptions(options => ({...options, issuedBy: orgDict}))
        }
      }),
    ]).then(() => {
      if (mode === 'edit' && id) {
        fetchOrganization(id).then(res => {
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
              hasIdentifier: organization.hasIdentifier || '',
              telephone: organization.telephone?
                `+${organization.telephone.countryCode} (${String(organization.telephone.phoneNumber).slice(0, 3)}) ${String(organization.telephone.phoneNumber).slice(3, 6)}-${String(organization.telephone.phoneNumber).slice(6, 10)}` :
                ''
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
        });
      } else if (mode === 'edit' && !id) {
        navigate('/organizations');
        enqueueSnackbar("No ID provided", {variant: 'error'});
      } else {
        setLoading(false)
      }
    }).catch(e => {
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
      updateOrganization(id, {form},).then((res) => {
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
    setErrors(error);

    return Object.keys(error).length === 0;
    // && outcomeFormErrors.length === 0 && indicatorFormErrors.length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Organization Basic</Typography>
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
          disabled={!userContext.isSuperuser}
          key={'organizationNumber'}
          label={'Organization Number'}
          value={form.organizationNumber}
          required
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.organizationNumber = e.target.value}
          error={!!errors.organizationNumber}
          helperText={errors.organizationNumber}
          // onBlur={() => {
          //   if (form.ID === '') {
          //     setErrors(errors => ({...errors, ID: 'This field cannot be empty'}));
          //   } else {
          //     setErrors(errors => ({...errors, ID: ''}));
          //   }
          // }}
        />


        <SelectField
          // disabled={mode === 'new' || !userContext.isSuperuser}
          key={'issuedBy'}
          label={'Number Issued By'}
          value={form.issuedBy}
          options={options.issuedBy}
          error={!!errors.issuedBy}
          helperText={
            errors.issuedBy
          }
          // onBlur={() => {
          //   if (form.administrator === '') {
          //     setErrors(errors => ({...errors, administrator: 'This field cannot be empty'}));
          //   } else {
          //     setErrors(errors => ({...errors, administrator: ''}));
          //   }
          // }}
          onChange={e => {
            setForm(form => ({
                ...form, issuedBy: e.target.value
              })
            );
          }}
        />

        <GeneralField
          disabled={!userContext.isSuperuser}
          key={'hasIdentifier'}
          label={'ID'}
          value={form.hasIdentifier}
          required
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.hasIdentifier = e.target.value}
          error={!!errors.hasIdentifier}
          helperText={errors.hasIdentifier}
          onBlur={() => {
            if (form.hasIdentifier === '') {
              setErrors(errors => ({...errors, hasIdentifier: 'This field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, hasIdentifier: ''}));
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
          required
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


      <Paper sx={{p: 2}} variant={'outlined'}>
        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>
      </Paper>

    </Container>);

}