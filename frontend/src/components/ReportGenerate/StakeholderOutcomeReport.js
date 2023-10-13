import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import {useSnackbar} from "notistack";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {FileDownload, PictureAsPdf, Undo} from "@mui/icons-material";
import {fetchOutcomes} from "../../api/outcomeApi";
import {jsPDF} from "jspdf";
import {fetchStakeholders} from "../../api/stakeholderAPI";
import {
  fetchStakeholderOutcomes,
  fetchStakeholderOutcomesThroughOrganization,
  fetchStakeholderOutcomesThroughStakeholder
} from "../../api/stakeholderOutcomeAPI";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchOrganizations} from "../../api/organizationApi";

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


export default function StakeholderOutcomeReports() {

  const classes = useStyles();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [organizations, setOrganizations] = useState({});
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [stakeholderOutcomes, setStakeholderOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);

  const generateTXTFile = () => {
    let str = '';
    const addLine = (line, space) => {
      if (space)
        [...Array(space).keys()].map(() => {
          str += ' ';
        });
      str += line + '\n';
    };

    outcomes.map(outcome => {
      addLine('Outcome: ' + outcome.name || '', 2);
      outcome.indicators.map(indicator => {
        addLine(`Indicator Name: ${indicator.name || ''}`, 6);
        addLine(`Unit of Measure: ${indicator.unitOfMeasure?.label || ''}`, 10);
        indicator.indicatorReports.map(indicatorReport => {
          addLine(`Indicator Report: ${indicatorReport.name || ''}`, 10);
          addLine(`Value: ${indicatorReport.value?.numericalValue || ''}`, 14);
          addLine(indicatorReport.hasTime ? `Time Interval: ${(new Date(indicatorReport.hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(indicatorReport.hasTime.hasEnd.date)).toLocaleString()}` : '', 14);
        });
      });

    });

    const file = new Blob([str], {type: 'text/plain'});
    saveAs(file, 'outcomeReport.txt');
  };


  const generatePDFFile = () => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a5',
      putOnlyUsedFonts: true
    });
    let x = 20;
    let y = 20;
    pdf.setFontSize(20);
    pdf.text("Outcome Reports", x, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.text(`Generated at ${(new Date).toLocaleString()}`, x, y);
    y += 10;
    outcomes.map((outcome) => {
      x = 23;
      y += 6;
      pdf.text(`Outcome Name: ${outcome.name}`, x, y);
      // y += 3;
      outcome.indicators?.map(indicator => {
        x = 26;
        y += 6;
        pdf.text(`Indicator Name: ${indicator.name}`, x, y);
        y += 6;
        pdf.text(`Unit Of Measure: ${indicator.unitOfMeasure.label}`, x, y);
        y += 6;
        indicator.indicatorReports?.map(indicatorReport => {
          x = 29;
          pdf.text(`Indicator Report Name: ${indicatorReport.name}`, x, y);
          y += 6;
        });
      });
    });
    pdf.save('outcome report.pdf');
  };

  useEffect(() => {
    fetchOrganizations().then(({organizations, success}) => {
      if (success) {
        const organizationsOps = {};
        if (userContext.isSuperuser)
          organizationsOps['all'] = 'All Stakeholder Outcomes'
        organizations.map(organization => {
          organizationsOps[organization._uri] = organization.legalName;
        });
        setOrganizations(organizationsOps);
        setLoading(false);
      }
    }).catch(e => {
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching stakeholders", {variant: 'error'});
    });

  }, []);

  useEffect(() => {
    if (selectedOrganization === 'all') {
      fetchStakeholderOutcomes().then(({
                                         success,
                                         stakeholderOutcomes
                                       }) => {
        if (success) {
          setStakeholderOutcomes(stakeholderOutcomes);
        }
      }).catch(e => {
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching outcomes", {variant: 'error'});
      });
    } else if (selectedOrganization) {
      fetchStakeholderOutcomesThroughOrganization(encodeURIComponent(selectedOrganization)).then(({
                                                                                                    success,
                                                                                                    stakeholderOutcomes
                                                                                                  }) => {
        if (success) {
          setStakeholderOutcomes(stakeholderOutcomes);
        }
      }).catch(e => {
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching outcomes", {variant: 'error'});
      });
    } else {
      setStakeholderOutcomes([]);
    }
  }, [selectedOrganization]);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'} sx={{position: 'relative'}}>
        <Typography variant={'h4'}> Stakeholder Outcomes </Typography>

        <Button variant="outlined"
                sx={{position: 'absolute', right: 0, marginTop: 1.5, backgroundColor: '#dda0dd', color: 'white'}}
                onClick={() => {
                  navigate('/reportGenerate');
                }} startIcon={<Undo/>}>
          Back
        </Button>
        {stakeholderOutcomes.length ?
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
          defaultOptionTitle={'Select an Organization'}
          onChange={e => {
            setSelectedOrganization(
              e.target.value
            );
          }}
        />

        {stakeholderOutcomes.length ? stakeholderOutcomes.map((stakeholderOutcome, index) => {
          return (
            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'body1'}> {`Stakeholder Outcome Name: `}<Link
                to={`/stakeholderOutcome/${encodeURIComponent(stakeholderOutcome._uri)}/view`} color={'#2f5ac7'}
                colorWithHover>{stakeholderOutcome.name || ''}</Link> </Typography>
              <Typography variant={'body1'}> {`Description: ${stakeholderOutcome.description}`} </Typography>
              <Typography variant={'body1'}> {`Outcome: `}<Link
                to={`/outcome/${encodeURIComponent(stakeholderOutcome.outcome._uri)}/view`} color={'#2f5ac7'}
                colorWithHover>{stakeholderOutcome.outcome.name || ''}</Link></Typography>
              <Typography variant={'body1'}> {`Importance: ${stakeholderOutcome.importance}`}</Typography>
              <Typography variant={'body1'}> {`isUnderserved: ${stakeholderOutcome.isUnderserved}`}</Typography>
              {/*<Typography variant={'body1'}> {`For Stakeholder:`}</Typography>*/}
              {/*<Typography variant={'body1'}><Link to={`/stakeholder/${encodeURIComponent(stakeholderOutcome.stakeholder._uri)}/view`}*/}
              {/*                                    color={'#2f5ac7'}*/}
              {/*                                    colorWithHover>{stakeholderOutcome.stakeholder.name || 'Name Not Given'}</Link></Typography>*/}

              <Typography variant={'body1'}> {stakeholderOutcome.codes?.length ? `Codes: ` : ''} </Typography>
              {stakeholderOutcome.codes?.length ?
                stakeholderOutcome.codes.map(code =>
                  <Typography variant={'body1'}><Link to={`/code/${encodeURIComponent(code._uri)}/view`}
                                                      color={'#2f5ac7'}
                                                      colorWithHover>{code.name || 'Name Not Given'}</Link></Typography>
                )
                : null}
              <Typography
                variant={'body1'}> {stakeholderOutcome.impactReports?.length ? `ImpactReports: ` : ''} </Typography>
              {stakeholderOutcome.impactReports?.length ?
                stakeholderOutcome.impactReports.map(impactReport =>
                  <Typography variant={'body1'}><Link to={`/impactReport/${encodeURIComponent(impactReport._uri)}/view`}
                                                      color={'#2f5ac7'} colorWithHover>{impactReport.name || ''}</Link></Typography>
                )
                : null}


            </Paper>

          );
        }) : null}


      </Paper>


    </Container>
  );

}