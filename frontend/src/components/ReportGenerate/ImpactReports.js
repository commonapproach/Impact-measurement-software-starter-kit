import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import {
  fetchOrganizations,
} from "../../api/organizationApi";
import SelectField from "../shared/fields/SelectField";
import {Undo, PictureAsPdf, FileDownload} from "@mui/icons-material";
import {jsPDF} from "jspdf";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {useSnackbar} from "notistack";
import {fetchImpactReports} from "../../api/impactReportAPI";
import {fetchStakeholderOutcome, fetchStakeholderOutcomeInterface} from "../../api/stakeholderOutcomeAPI";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {UserContext} from "../../context";

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


export default function ImpactReports_ReportGenerate() {

  const classes = useStyles();
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const userContext = useContext(UserContext);
  const [organizations, setOrganizations] = useState({});
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [interfaces, setInterfaces] = useState({
    stakeholderOutcome: {}
  })
  const [impactReports, setImpactReports] = useState([]);
  const [loading, setLoading] = useState(true);


  const generateTXTFile = () => {
    let str = '';
    const addLine = (line, space) => {
      if (space)
        [...Array(space).keys()].map(() => {
          str += ' ';
        });
      str += line + '\n';
    };


    impactReports.map(impactReport => {
      addLine(`Impact Report: ${impactReport.name || 'Name Not Given'}`, 2);
      addLine(`Comment: ${impactReport.comment || 'Not Given'}`, 2);
      addLine(`Impact Depth: ${impactReport.impactDepth?.value?.numericalValue || 'Not Given'}`, 2);
      addLine(`Impact Scale: ${impactReport.impactScale?.value?.numericalValue || 'Not Given'}`, 2);
      addLine(`Stakeholder Outcome: ${impactReport.forStakeholderOutcome?.name || 'Name Not Given'}`, 2);
      addLine('')
    });

    const file = new Blob([str], {type: 'text/plain'});
    saveAs(file, 'impactReport.txt');
  };


  useEffect(() => {
    Promise.all([fetchOrganizations(), fetchStakeholderOutcomeInterface()]).then(
      ([{organizations}, {stakeholderOutcomeInterface}]) => {
        const organizationsOps = {};
        if (userContext.isSuperuser)
          organizationsOps['all'] = 'All Impact Reports'
        organizations.map(organization => {
          organizationsOps[organization._uri] = organization.legalName;
        });
        setInterfaces(interfaces => ({...interfaces, stakeholderOutcome: stakeholderOutcomeInterface}))
        setOrganizations(organizationsOps);
        setLoading(false);
      }
    ).catch(([e]) => {
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching organizations", {variant: 'error'});
    });

  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchImpactReports(encodeURIComponent(selectedOrganization)).then(({success, impactReports}) => {
        if (success) {
          setImpactReports(impactReports);
        }
      }).catch(e => {
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching impactReports", {variant: 'error'});
      });
    } else {
      setImpactReports([]);
    }
  }, [selectedOrganization]);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'} sx={{position: 'relative'}}>
        <Typography variant={'h4'}> Impact Reports </Typography>

        <Button variant="outlined"
                sx={{position: 'absolute', right: 0, marginTop: 1.5, backgroundColor: '#dda0dd', color: 'white'}}
                onClick={() => {
                  navigate('/reportGenerate');
                }} startIcon={<Undo/>}>
          Back
        </Button>
        {impactReports.length ?
          <Button variant="contained" color="primary" className={classes.button}
                  sx={{position: 'absolute', right: 100, marginTop: 0}}
                  onClick={generateTXTFile} startIcon={<FileDownload/>}>
            Generate TXT File
          </Button>
          :
          null}

        <SelectField
          key={'organization'}
          label={'Organization'}
          value={selectedOrganization}
          options={organizations}
          defaultOptionTitle={'Select an organization'}
          onChange={e => {
            setSelectedOrganization(
              e.target.value
            );
          }}
        />
        {impactReports.length ? impactReports.map((impactReport, index) => {
          return (

            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'h6'}> {`Impact Report: ${impactReport.name || 'Name Not Given'}`}  </Typography>
              <Typography variant={'body1'} sx={{pl: 4}}> {'Name: '}<Link
                to={`/impactReport/${encodeURIComponent(impactReport._uri)}/view`} colorWithHover
                color={'#2f5ac7'}>{impactReport.name || 'Name Not Given'}</Link> </Typography>
              <Typography variant={'body1'}
                          sx={{pl: 4}}> {`Comment: ${impactReport.comment || 'Not Given'}`} </Typography>
              <Typography variant={'body1'}
                          sx={{pl: 4}}> {`Impact Depth: ${impactReport.impactDepth?.value?.numericalValue || 'Not Given'}`} </Typography>
              <Typography variant={'body1'}
                          sx={{pl: 4}}> {`Impact Scale: ${impactReport.impactScale?.value?.numericalValue || 'Not Given'}`} </Typography>
              <Typography variant={'body1'} sx={{pl: 4}}> {'Stakeholder Outcome: '}<Link
                to={`/stakeholderOutcome/${encodeURIComponent(impactReport.forStakeholderOutcome._uri)}/view`} colorWithHover
                color={'#2f5ac7'}>{impactReport.forStakeholderOutcome?.name || 'Name Not Given'}</Link> </Typography>

            </Paper>

          );
        }) : null}

      </Paper>


    </Container>
  );

}