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
  fetchOrganizationsBasedOnGroup,
  updateOrganization
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


export default function GroupMembers() {

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


  const [groups, setGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups().then(res => {
      if (res.success) {
        const groups = {};
        res.groups.map(group => {
          groups[group._uri] = group.label;
        });
        setGroups(groups);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchOrganizationsBasedOnGroup(encodeURIComponent(selectedGroup)).then(({organizations, success}) => {
        if (success) {
          setOrganizations(organizations);
        }
      });

    }
  }, [selectedGroup]);


  // useEffect(() => {
  //
  //   Promise.all([
  //     fetchOrganizations().then(({organizations, success}) => {
  //       if (success) {
  //         const orgDict = {};
  //         organizations.map(org => {
  //           if (org._uri !== uri)
  //             orgDict[org._uri] = org.legalName;
  //         });
  //         setOptions(options => ({...options, issuedBy: orgDict}))
  //       }
  //     }),
  //   ]).then(() => {
  //     if (mode === 'edit' && uri) {
  //       Promise.all([
  //         fetchUsers(encodeURIComponent(uri)).then(({data, success}) => {
  //           const objectForm = {};
  //           data.map(user => {
  //             objectForm[user._uri] = `${user.person.givenName} ${user.person.familyName} URI: ${user._uri}`;
  //           });
  //           if (success)
  //             setOptions(options => ({...options, objectForm}));
  //         }),
  //         fetchOrganization(encodeURIComponent(uri)).then(res => {
  //           if (res.success) {
  //             const {organization} = res;
  //             setForm({
  //               legalName: organization.legalName || '',
  //               organizationNumber: organization.organizationNumber || '',
  //               issuedBy: organization.issuedBy || '',
  //               administrator: organization.administrator || '',
  //               reporters: organization.reporters || [],
  //               editors: organization.editors || [],
  //               researchers: organization.researchers || [],
  //               comment: organization.comment || '',
  //               contactName: organization.contactName || '',
  //               email: organization.email || '',
  //               telephone: organization.telephone?
  //                 `+${organization.telephone.countryCode} (${String(organization.telephone.phoneNumber).slice(0, 3)}) ${String(organization.telephone.phoneNumber).slice(3, 6)}-${String(organization.telephone.phoneNumber).slice(6, 10)}` :
  //                 '',
  //               uri: organization._uri || ''
  //             });
  //             setLoading(false)
  //           }
  //         }).catch(e => {
  //           if (e.json)
  //             setErrors(e.json);
  //           console.log(e)
  //           setLoading(false);
  //           reportErrorToBackend(e);
  //           enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
  //         })
  //       ]);
  //     } else if (mode === 'edit' && !uri) {
  //       navigate('/organizations');
  //       enqueueSnackbar("No URI provided", {variant: 'error'});
  //     } else {
  //       setLoading(false)
  //     }
  //   }).catch(e => {
  //     console.log(e)
  //     if (e.json)
  //       setErrors(e.json);
  //     reportErrorToBackend(e);
  //     setLoading(false);
  //
  //     enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
  //   });
  //
  //
  // }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {

  };

  // const validate = () => {
  //   const error = {};
  //   if (!form.legalName) {
  //     error.legalName = 'The field cannot be empty';
  //   }
  //   setErrors(error);
  //
  //   return Object.keys(error).length === 0;
  //   // && outcomeFormErrors.length === 0 && indicatorFormErrors.length === 0;
  // };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Group Members </Typography>


        <SelectField
          key={'group'}
          label={'Group'}
          value={selectedGroup}
          options={groups}
          error={!!errors.group}
          helperText={
            errors.group
          }
          onChange={e => {
            setSelectedGroup(
              e.target.value
            );
          }}
        />
        {organizations.length ? organizations.map((organization, index) => {
          return (
            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'h6'}> {`Organization ${organization.legalName}`}  </Typography>
              <GeneralField
                disabled
                key={`${organization._uri} name`}
                label={`Legal Name`}
                value={organization.legalName}
              />
              {
                organization.contactName ?
                  <GeneralField
                    disabled
                    key={`${organization._uri} contact name`}
                    label={`Contact Name`}
                    value={organization.contactName}
                  /> : null
              }

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


      {organizations.length ?
        <Paper sx={{p: 1}}>
          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
          }}>
            Generate Json File
          </Button>
        </Paper> :
        null}

      <Paper sx={{p: 1}} >
        <Button variant="contained" color="primary" className={classes.button} onClick={() => {
          navigate('/reportGenerate');
        }} startIcon={<Undo />}>
          Back
        </Button>
      </Paper>

    </Container>
  );

}