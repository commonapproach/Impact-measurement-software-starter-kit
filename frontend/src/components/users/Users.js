import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {deleteUser, fetchUsers} from "../../api/userApi";
import {useNavigate, useParams} from "react-router-dom";
import {formatPhoneNumber} from "../../helpers/phone_number_helpers";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";

export default function Users() {
  const navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);
  const {organizationURI} = useParams();
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
      // superuser, with no groupURI
      fetchUsers(organizationURI? encodeURIComponent(organizationURI): undefined).then(({data, success}) => {
        setState(state => ({...state, loading: false, data: data}));
      }).catch(e => {
        reportErrorToBackend(e)
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });


  }, [trigger]);

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete user ' + uri + ' ?'
    }));
  };

  const handleDelete = async (uri, form) => {


    deleteUser(uri).then(({success, message}) => {
      if (success) {
        setState(state => ({
          ...state, showDeleteDialog: false,
        }));
        setTrigger(!trigger);
        enqueueSnackbar(message || "Success", {variant: 'success'});
      }
    }).catch((e) => {
      setState(state => ({
        ...state, showDeleteDialog: false,
      }));
      setTrigger(!trigger);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });

  };

  const columns = [
    {
      label: 'Username/Email',
      body: ({_uri, email}) => {
        if (!organizationURI)
          return <Link colorWithHover to={`/users/${encodeURIComponent(_uri)}/edit`}>
          {email}
        </Link>;
        return email
      },
      sortBy: ({email}) => email
    },
    {
      label: 'First name',
      body: ({person}) => {
        if (person && person.givenName)
          return person.givenName;
        return 'Not Provided';
      }
    },
    {
      label: 'Last name',
      body: ({person}) => {
        if (person && person.familyName)
          return person.familyName;
        return 'Not Provided';
      }
    },
    {
      label: 'Phone Number',
      body: ({primaryContact}) => {
        if (primaryContact && primaryContact.telephone)
          return formatPhoneNumber(primaryContact.telephone);
        return 'Not Provided';
      },
    },

    {
      label: 'Organizations',
      body: ({associatedOrganizations}) => {
        return associatedOrganizations?.map(organization => organization.legalName)
      },
    },

    {
      label: 'Role',
      body: ({isSuperuser, groupAdminOfs, administratorOfs, editorOfs, reporterOfs, researcherOfs}) => {
        let ret = '';
        if (isSuperuser)
          ret += 'Superuser, ';
        if (groupAdminOfs?.length)
          ret += 'Group Admin, '
        if(administratorOfs?.length)
          ret += 'Admin, ';
        if (editorOfs?.length)
          ret += 'Editor, ';
        if (reporterOfs?.length)
          ret += 'Reporter, '
        if (researcherOfs?.length)
          ret += 'Researcher, '

        if(ret === '') {
          ret = 'Null';
        } else {
          ret = ret.slice(0, -2)
        }
        return ret;

      }
    },
    {
      label: ' ',
      body: ({_uri}) => {
        return <DropdownMenu urlPrefix={'users'} objectUri={encodeURIComponent(_uri)} hideDeleteOption hideViewOption hideEditOption={organizationURI}
                      handleDelete={() => showDeleteDialog(_uri)}/>;
      }
    }
  ];

  if (state.loading)
    return <Loading message={`Loading users...`}/>;

  return (
    <Container>
      <DataTable
        title={"Users"}
        data={state.data}
        columns={columns}
        uriField="uri"
        customToolbar={
          <Chip
            onClick={() => navigate('/users/invite')}
            color="primary"
            icon={<AddIcon/>}
            label="Invite User"
            variant="outlined"/>
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete}
      />
    </Container>
  );
}
