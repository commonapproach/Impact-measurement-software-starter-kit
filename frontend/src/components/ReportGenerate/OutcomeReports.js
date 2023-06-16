import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import {
  fetchOrganizations,
  fetchOrganizationsBasedOnGroup,
} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {PictureAsPdf, Undo} from "@mui/icons-material";
import {fetchOutcomes} from "../../api/outcomeApi";
import {jsPDF} from "jspdf";

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


export default function OutcomeReports() {

  const classes = useStyles();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState({});
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const {enqueueSnackbar} = useSnackbar();


  const generatePDFFile = () => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a5',
      putOnlyUsedFonts:true
    });
    let x = 20
    let y = 20
    pdf.setFontSize(20);
    pdf.text("Outcome Reports", x, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.text(`Generated at ${(new Date).toLocaleString()}`, x, y);
    y += 10;
    outcomes.map((outcome) => {
      x = 23;
      y += 6
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
          pdf.text(`Indicator Report Name: ${indicatorReport.name}`, x, y)
          y += 6;
        })
      })
    })
    pdf.save('outcome report.pdf');
  }

  useEffect(() => {
    fetchOrganizations().then(({organizations, success}) => {
      if (success) {
        const organizationsOps = {};
        organizations.map(organization => {
          organizationsOps[organization._uri] = organization.legalName;
        });
        setOrganizations(organizationsOps);
        setLoading(false);
      }
    }).catch(e => {
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching organizations", {variant: 'error'});
    });

  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchOutcomes(encodeURIComponent(selectedOrganization)).then(({success, outcomes}) => {
        if (success) {
          setOutcomes(outcomes);
        }
      }).catch(e => {
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching outcomes", {variant: 'error'});
      });
    } else {
      setOutcomes([])
    }
  }, [selectedOrganization]);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'} sx={{position: 'relative'}}>
        <Typography variant={'h4'}> Outcomes </Typography>

        <Button variant="outlined"  sx={{position: 'absolute', right:0, marginTop:1.5, backgroundColor:'#dda0dd', color:'white'}} onClick={() => {
          navigate('/reportGenerate');
        }} startIcon={<Undo />}>
          Back
        </Button>
        {outcomes.length ?
          <Button variant="contained" color="primary" className={classes.button} sx={{position: 'absolute', right:100, marginTop:0}}
                  onClick={generatePDFFile} startIcon={<PictureAsPdf />}>
            Generate PDF File
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

        {outcomes.length ? outcomes.map((outcome, index) => {
          return (
            <Paper sx={{p: 2}} variant={'outlined'}>
              {/*<Typography variant={'body1'}> {`Outcome: ${outcome.name}`}  </Typography>*/}
              <Typography variant={'body1'}> {'Name: '}<Link to={`/outcome/${encodeURIComponent(outcome._uri)}/view`} color={'#2f5ac7'} colorWithHover>{outcome.name}</Link> </Typography>
              {outcome.indicators?
                <Paper elevation={0}>
                {/*<Typography variant={'body1'}> {`Indicators:`}  </Typography>*/}
                  {outcome.indicators.map(indicator => {
                    return (
                      <Paper elevation={0} sx={{pl: 4}}>
                        <Typography variant={'body1'}> {`Indicator Name: `}<Link to={`/indicator/${encodeURIComponent(indicator._uri)}/view`} color={'#2f5ac7'} colorWithHover>{indicator.name}</Link> </Typography>
                        <Typography variant={'body1'} sx={{pl: 4}}> {`Unit of Measure: ${indicator.unitOfMeasure.label}`} </Typography>

                          {indicator.indicatorReports?
                              (indicator.indicatorReports.map(indicatorReport =>
                                <Paper elevation={0} sx={{pl: 4}}>
                                <Typography variant={'body1'}> {`Indicator Report: `}<Link
                                  to={`/indicatorReport/${encodeURIComponent(indicatorReport._uri)}/view`}
                                  color={'#2f5ac7'} colorWithHover>{indicatorReport.name}</Link> </Typography>
                                  <Typography variant={'body1'} sx={{pl: 4}}> {`Value: ${indicatorReport.value.numericalValue}`} </Typography>
                                  <Typography variant={'body1'} sx={{pl: 4}}> {`Time Interval: ${(new Date(indicatorReport.hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(indicatorReport.hasTime.hasEnd.date)).toLocaleString()}`} </Typography>
                                </Paper>

                              ))
                            :null
                          }
                      </Paper>)
                  })}
                </Paper> : null}


            </Paper>

          );
        }) : null}


      </Paper>


    </Container>
  );

}