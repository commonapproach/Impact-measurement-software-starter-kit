import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {fetchOutcomes} from "../../api/outcomeApi";
import {fetchIndicatorReports} from "../../api/indicatorReportApi";
import {reportErrorToBackend} from "../../api/errorReportApi";

export default function IndicatorReports() {
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
    editable: false
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    fetchIndicatorReports(id).then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.indicatorReports, editable: res.editable}));
    }).catch(e => {
      reportErrorToBackend(e)
      setState(state => ({...state, loading: false}))
      console.log(e)
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
        return state.editable?<Link color to={`/indicatorReport/${_id}/view`}>
          {name}
        </Link>:name
      },
      sortBy: ({name}) => name
    },
    {
      label: 'value',
      body: ({value}) => {
        return value.numericalValue;
      }
    },
    {
      label: 'Unit Of Measure',
      body: ({value}) => {
        return value.unitOfMeasure.label
      }
    },
    {
      label: 'Start Time',
      body: ({hasTime}) => {
        return (new Date(hasTime.hasBeginning.date)).toString()
      },
    },
    {
      label: 'End Time',
      body: ({hasTime}) => {
        return (new Date(hasTime.hasEnd.date)).toString()
      },
    },

    {
      label: ' ',
      body: ({_id}) =>
        <DropdownMenu urlPrefix={'indicatorReport'} objectId={_id} hideEditOption={!state.editable} hideDeleteOption
                      handleDelete={() => showDeleteDialog(_id)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading Indicator Reports...`}/>;

  return (
    <Container>
      <DataTable
        title={"Indicator Reports"}
        data={state.data}
        columns={columns}
        idField="id"
        customToolbar={
          <Chip
            disabled={!state.editable}
            onClick={() => navigate(`/indicatorReport/${id}/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new IndicatorReports"
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
