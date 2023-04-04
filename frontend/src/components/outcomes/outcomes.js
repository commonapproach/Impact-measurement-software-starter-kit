import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {fetchOutcomes} from "../../api/outcomeApi";
import {reportErrorToBackend} from "../../api/errorReportApi";

export default function Outcomes() {
  const navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar();
  const {id} = useParams();

  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false,
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    fetchOutcomes(id).then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.outcomes, editable: res.editable}));
    }).catch(e => {
      reportErrorToBackend(e)
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
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
      body: ({_id, name, editable}) => {
        return editable? <Link color to={`/outcome/${_id}/view`}>
          {name}
        </Link>:name
      },
      sortBy: ({name}) => name
    },
    {
      label: 'Indicators',
      body: ({indicators}) => {
        return indicators.join(", ");
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

    {
      label: ' ',
      body: ({_id, editable}) =>
        <DropdownMenu urlPrefix={'outcome'} objectId={_id} hideEditOption={!editable} hideDeleteOption
                      handleDelete={() => showDeleteDialog(_id)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading outcomes...`}/>;

  return (
    <Container>
      <DataTable
        title={"Outcomes"}
        data={state.data}
        columns={columns}
        idField="id"
        customToolbar={
          <Chip
            disabled={!state.editable}
            onClick={() => navigate(`/outcome/${id}/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Outcome"
            variant="outlined"/>
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
