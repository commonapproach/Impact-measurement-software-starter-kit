import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {deleteOrganization, fetchOrganizations} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {fetchIndicators} from "../../api/indicatorApi";
import {reportErrorToBackend} from "../../api/errorReportApi";

export default function Indicators() {
  const navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();

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
    fetchIndicators(encodeURIComponent(uri)).then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.indicators}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      reportErrorToBackend(e)
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
      body: ({_uri, name, editable}) => {
        // console.log(editable)
        return editable?
          <Link colorWithHover to={`/indicator/${encodeURIComponent(_uri)}/view`}>
          {name}
        </Link>:
          name
      },
      sortBy: ({name}) => name
    },
    {
      label: 'Unit of Measure',
      body: ({unitOfMeasure}) => {
        return unitOfMeasure?.label;
      }
    },

    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'indicator'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
                      hideEditOption={!userContext.isSuperuser && !userContext.editorOf.length}
                      handleDelete={() => showDeleteDialog(_uri)}/>
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
        uriField="uri"
        customToolbar={
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate(`/indicator/${encodeURIComponent(uri)}/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Indicator"
            variant="outlined"/>
        }

      />
    </Container>
  );
}
