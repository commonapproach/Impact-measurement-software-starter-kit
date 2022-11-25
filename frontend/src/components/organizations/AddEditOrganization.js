import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {createOrganization, fetchOrganization, updateOrganization} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import {fetchUsers} from "../../api/userApi";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";

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


export default function AddEditOrganization() {

  const classes = useStyles();
  const navigate = useNavigate();
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
    administrator: '',
    reporters: [],
    editors: [],
    researchers: [],
    comment: '',
  });
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    reporters: {},
    editors: [],
    researchers: [],
    administrators: [],
  });

  useEffect(() => {
    Promise.all([
      fetchUsers('editor').then(({data}) => {
        data.map(editor => {
          options.editors[editor] = editor
        })
      }),
      fetchUsers('reporter').then(({data}) => {
        data.map(reporter => {
          options.reporters[reporter] = reporter
        })
      }),
      fetchUsers('admin').then(({data}) => {
        options.administrators = data
      }),
      fetchUsers('researcher').then(({data}) => {
        data.map(researcher => {
          options.researchers[researcher] = researcher
        })
      }),
      fetchUsers('superuser').then(({data}) => {
        data.map((superuser) => {
          options.reporters[superuser] = superuser;
          options.editors[superuser] = superuser;
          options.researchers[superuser] = superuser;
          options.administrators.push(superuser);
        })
      }),
    ]).then(() => {
      if (mode === 'edit' && id) {
        fetchOrganization(id).then(res => {
          if (res.success) {
            const organization = res.organization;
            setForm({
              legalName: organization.legalName || '',
              administrator: organization.administrator || '',
              reporters: organization.reporters || [],
              editors: organization.editors || [],
              researchers: organization.researchers || [],
              comment: organization.comment || ''
            });
            setLoading(false);
          }
        });
      } else if (mode === 'edit' && !id) {
        navigate('/organizations');
        enqueueSnackbar("No ID provided", {variant: 'error'});
      } else if (mode === 'new') {
        setLoading(false);
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });


  }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    console.log(mode);
    if (mode === 'new') {
      createOrganization(form).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organizations');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        enqueueSnackbar(e.json?.message || 'Error occurs when creating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      updateOrganization(id, form).then((res) => {
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
    }

  };

  const validate = () => {
    const error = {};
    if (form.legalName === '') {
      error.legalName = 'The field cannot be empty';
    }
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Organization </Typography>
        <GeneralField
          key={'legalName'}
          label={'Legal Name'}
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
        {/*<Dropdown*/}
        {/*  label="Users"*/}
        {/*  key={'users'}*/}
        {/*  value={form.users}*/}
        {/*  onChange={e => {*/}
        {/*    form.users = e.target.value*/}
        {/*  }}*/}
        {/*  options={allUsers}*/}
        {/*  onBlur = {() => {*/}
        {/*    if(form.users.length === 0) {*/}
        {/*      setErrors(errors => ({...errors, 'userTypes': 'This field is required'}));*/}
        {/*    } else {*/}
        {/*      setErrors(errors => ({...errors, 'userTypes': null}));*/}
        {/*    }*/}
        {/*  }*/}
        {/*  }*/}
        {/*  error={!!errors.users}*/}
        {/*  helperText={errors.users}*/}
        {/*  // sx={{mb: 2}}*/}
        {/*  noEmpty*/}
        {/*  required = {true}*/}
        {/*/>*/}
        <SelectField
          key={'administrator'}
          label={'Organization Administrator'}
          value={form.administrator}
          options={options.administrators}
          error={!!errors.administrator}
          helperText={errors.administrator}
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
          value={form.editors}
          onChange={e => {
            form.editors = e.target.value;
          }}
          options={options.editors}
          error={!!errors.editors}
          helperText={errors.editors}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Reporters"
          key={'reporters'}
          value={form.reporters}
          onChange={e => {
            form.reporters = e.target.value;
          }}
          options={options.reporters}
          error={!!errors.reporters}
          helperText={errors.reporters}
          // sx={{mb: 2}}
        />
        <Dropdown
          label="Researcher"
          key={'researcher'}
          value={form.researchers}
          onChange={e => {
            form.researchers = e.target.value;
          }}
          options={options.researchers}
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
        />

        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>

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