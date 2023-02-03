import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {deleteOrganization, fetchOrganizations} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {fetchIndicators} from "../../api/indicatorApi";

export default function Indicators() {
  const navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar();
  const {id} = useParams();

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
    fetchIndicators(id, userContext).then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.indicators}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  // const showDeleteDialog = (id) => {
  //   setState(state => ({
  //     ...state, selectedId: id, showDeleteDialog: true,
  //     deleteDialogTitle: 'Delete organization ' + id + ' ?'
  //   }));
  // };

  // const handleDelete = async (id, form) => {
  //
  //   deleteOrganization(id).then(({success, message})=>{
  //     if (success) {
  //       setState(state => ({
  //         ...state, showDeleteDialog: false,
  //       }));
  //       setTrigger(!trigger);
  //       enqueueSnackbar(message || "Success", {variant: 'success'})
  //     }
  //   }).catch((e)=>{
  //     setState(state => ({
  //       ...state, showDeleteDialog: false,
  //     }));
  //     setTrigger(!trigger);
  //     enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
  //   });
  //
  // };

  const columns = [
    {
      label: 'Name',
      body: ({_id, name}) => {
        return <Link color to={`/indicator/${_id}/edit`}>
          {name}
        </Link>
      },
      sortBy: ({name}) => name
    },
    // {
    //   label: 'Administrator',
    //   body: ({administrator}) => {
    //     return administrator;
    //   }
    // },
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

    {
      label: ' ',
      body: ({_id}) =>
        <DropdownMenu urlPrefix={'indicator'} objectId={_id} hideViewOption
                      handleDelete={() => showDeleteDialog(_id)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading indicators...`}/>;

  return (
    <Container>
      <DataTable
        title={"Indicators"}
        data={state.data}
        columns={columns}
        idField="id"
        customToolbar={
          userContext.isSuperuser?
          <Chip
            onClick={() => navigate(`/indicator/${id}/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Indicator"
            variant="outlined"/>
          :
          <div/>
        }

      />
      {/*<DeleteModal*/}
      {/*  objectId={state.selectedId}*/}
      {/*  title={state.deleteDialogTitle}*/}
      {/*  show={state.showDeleteDialog}*/}
      {/*  onHide={() => setState(state => ({...state, showDeleteDialog: false}))}*/}
      {/*  delete={handleDelete}*/}
      {/*/>*/}
    </Container>
  );
}
