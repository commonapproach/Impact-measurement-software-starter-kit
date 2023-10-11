import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useSnackbar } from 'notistack';
import {
  deleteOrganization,
  fetchOrganizationsGivenOrganizationAdmin
} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigate, navigateHelper} from "../../helpers/navigatorHelper";
import {useNavigate} from "react-router-dom";

export default function Organizations() {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)

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
    fetchOrganizationsGivenOrganizationAdmin(encodeURIComponent(userContext.uri)).then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.organizations}));
    }).catch(e => {
      reportErrorToBackend(e)
      setState(state => ({...state, loading: false}))
      navigate(`/dashboard`);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  const showDeleteDialog = (id) => {
    setState(state => ({
      ...state, selectedId: id, showDeleteDialog: true,
      deleteDialogTitle: 'Delete organization ' + id + ' ?'
    }));
  };

  const handleDelete = async (id, form) => {

    deleteOrganization(id).then(({success, message})=>{
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
      label: 'Legal Name',
      body: ({legalName, _uri}) => {
        return <Link colorWithHover to={`${process.env.PUBLIC_URL}/organizationOfUsers/${encodeURIComponent(_uri)}`}>
            {legalName}
          </Link>
      },
      sortBy: ({legalName}) => legalName
    },
    {
      label: 'Administrator',
      body: ({administrator}) => {
        return administrator;
      }
    },
  ];

  if (state.loading)
    return <Loading message={`Loading organizations...`}/>;

  return (
    <Container>
      <DataTable
        title={"Organizations"}
        data={state.data}
        columns={columns}
        idField="id"
        customToolbar={
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate(`/organizations/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Organization"
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
