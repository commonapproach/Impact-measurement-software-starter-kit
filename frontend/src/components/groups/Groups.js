import React, { useEffect, useState, useContext} from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useNavigate } from "react-router-dom";
import { formatPhoneNumber } from "../../helpers/phone_number_helpers";
import { useSnackbar } from 'notistack';
import {deleteGroup, fetchGroups} from "../../api/groupApi";
import {UserContext} from "../../context";

export default function Groups() {
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
    if(!userContext.isSuperuser && !userContext.groupAdminOf.length > 0){
      navigate('/dashboard');
      enqueueSnackbar( "Wrong Auth", {variant: 'error'});
    }
      fetchGroups(userContext).then(({groups}) => {
      setState(state => ({...state, loading: false, data: groups}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'})
    });
  }, [trigger]);

  const showDeleteDialog = (id) => {
    setState(state => ({
      ...state, selectedId: id, showDeleteDialog: true,
      deleteDialogTitle: 'Delete group ' + id + ' ?'
    }));
  };

  const handleDelete = async (id, form) => {


    deleteGroup(id).then(({success, message})=>{
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
      label: 'Label',
      body: ({_id, label}) => {
        return <Link color to={`/groups/${_id}/edit`}>
          {label}
        </Link>
      },
      sortBy: ({email}) => email
    },
    {
      label: 'Administrator',
      body: ({administrator}) => {
        if(administrator)
          return administrator
        return 'Not Provided'
      }
    },
    // {
    //   label: 'Last name',
    //   body: ({person}) => {
    //     if(person && person.familyName)
    //       return person.familyName
    //     return 'Not Provided'
    //   }
    // },
    // {
    //   label: 'Phone Number',
    //   body: ({primaryContact}) => {
    //     if (primaryContact && primaryContact.telephone)
    //       return formatPhoneNumber(primaryContact.telephone);
    //     return 'Not Provided';
    //   },
    // },
    //
    // {
    //   label: 'Role',
    //   body: ({userTypes}) => userTypes
    // },
    {
      label: ' ',
      body: ({_id}) =>
        <DropdownMenu urlPrefix={'groups'} objectId={_id} hideDeleteOption={!userContext.isSuperuser}
                      hideViewOption handleDelete={() => showDeleteDialog(_id)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading groups...`}/>;

  return (
    <Container>
      <DataTable
        title={"Groups"}
        data={state.data}
        columns={columns}
        idField="id"
        customToolbar={
          userContext.isSuperuser?
            <Chip
            onClick={() => navigate('/groups/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add group"
            variant="outlined"/>:
            <div/>
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
