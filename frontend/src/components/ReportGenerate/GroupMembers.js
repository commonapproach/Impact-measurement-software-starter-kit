import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {
  fetchOrganizationsBasedOnGroup,
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
import { jsPDF } from "jspdf"

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


  const [groups, setGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const generatePDFFile = () => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a5',
      putOnlyUsedFonts:true
    });
    let x = 20
    let y = 20
    pdf.text("Group Members Report", x, y);
    pdf.setFontSize(5);
    y += 10;
    organizations.map((organization, index) => {
      y += 3
      pdf.text(`Legal Name: ${organization.legalName}`, x, y);
      y += 3;
      if (organization.contactName){
        pdf.text(`Contact Name: ${organization.contactName}`, x, y)
        y += 3
      }
      if (organization.email) {
        pdf.text(`Contact Email: ${organization.email}`, x, y)
        y += 3
      }

    })
    pdf.save('group member.pdf');
  }
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
          onChange={e => {
            setSelectedGroup(
              e.target.value
            );
          }}
        />
        {organizations.length ? organizations.map((organization, index) => {
          return (
            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'h6'}> {`Organization: ${organization.legalName}`}  </Typography>

              <Typography variant={'body1'}> {'Legal Name: '}<Link to={`/organizations/${encodeURIComponent(organization._uri)}/edit`} color={'blue'}>{organization.legalName}</Link> </Typography>
              {organization.contactName ?
                <Typography variant={'body1'}> {`Contact Name: ${organization.contactName}`} </Typography> : null}
              {organization.email ?
                <Typography variant={'body1'}> {`Contact Email: ${organization.email}`} </Typography> : null}


            </Paper>

          );
        }) : null}

      </Paper>


      {organizations.length ?
        <Paper sx={{p: 1}}>
          <Button variant="contained" color="primary" className={classes.button} onClick={generatePDFFile}>
            Generate PDF File
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