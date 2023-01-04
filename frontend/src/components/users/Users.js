import React, { useEffect, useState, useContext} from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { deleteUser, fetchUsers } from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import { formatPhoneNumber } from "../../helpers/phone_number_helpers";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";

export default function Users() {
  const navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    fetchUsers(null, userContext.userTypes).then(data => {
      // console.log(data)
      setState(state => ({...state, loading: false, data: data.data}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'})
    });
  }, [trigger]);

  const showDeleteDialog = (id) => {
    setState(state => ({
      ...state, selectedId: id, showDeleteDialog: true,
      deleteDialogTitle: 'Delete user ' + id + ' ?'
    }));
  };

  const handleDelete = async (id, form) => {


      deleteUser(id).then(({success, message})=>{
        if (success) {
          setState(state => ({
            ...state, showDeleteDialog: false,
          }));
          setTrigger(!trigger);
          enqueueSnackbar(message || "Success", {variant: 'success'})
        }
      }).catch((e)=>{
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
      body: ({_id, email}) => {
        return <Link color to={`/users/${_id}`}>
          {email}
        </Link>
      },
      sortBy: ({email}) => email
    },
    {
      label: 'First name',
      body: ({person}) => {
        if(person && person.givenName)
          return person.givenName
        return 'Not Provided'
      }
    },
    {
      label: 'Last name',
      body: ({person}) => {
        if(person && person.familyName)
          return person.familyName
        return 'Not Provided'
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
      label: 'Role',
      body: ({userTypes}) => userTypes
    },
    {
      label: ' ',
      body: ({_id}) =>
        <DropdownMenu urlPrefix={'users'} objectId={_id}
                      handleDelete={() => showDeleteDialog(_id)}/>
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
        idField="id"
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
        objectId={state.selectedId}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete}
      />
    </Container>
  );
}
