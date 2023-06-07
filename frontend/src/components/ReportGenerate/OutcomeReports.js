import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {
  fetchOrganizations,
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
import {fetchIndicators} from "../../api/indicatorApi";
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


  const generatePDFFile = () => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a5',
      putOnlyUsedFonts:true
    });
    let x = 20
    let y = 20
    pdf.text("Outcome Reports", x, y);
    pdf.setFontSize(5);
    y += 10;
    outcomes.map((outcome) => {
      x = 23;
      y += 3
      pdf.text(`Outcome Name: ${outcome.name}`, x, y);
      // y += 3;
      outcome.indicators?.map(indicator => {
        x = 26;
        y += 3;
        pdf.text(`Indicator Name: ${indicator.name}`, x, y);
        y += 3;
        pdf.text(`Unit Of Measure: ${indicator.unitOfMeasure.label}`, x, y);
        y += 3;
        indicator.indicatorReports?.map(indicatorReport => {
          x = 29;
          pdf.text(`Indicator Report Name: ${indicatorReport.name}`, x, y)
          y += 3;
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
    });


  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchOutcomes(encodeURIComponent(selectedOrganization)).then(({success, outcomes}) => {
        if (success) {
          setOutcomes(outcomes);
        }
      });
    }
  }, [selectedOrganization]);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Outcomes </Typography>

        <SelectField
          key={'organization'}
          label={'Organization'}
          value={selectedOrganization}
          options={organizations}
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
              <Typography variant={'body1'}> {'Name: '}<Link to={`/outcome/${encodeURIComponent(outcome._uri)}/view`} color={'blue'}>{outcome.name}</Link> </Typography>
              {outcome.indicators?
                <Paper elevation={0}>
                {/*<Typography variant={'body1'}> {`Indicators:`}  </Typography>*/}
                  {outcome.indicators.map(indicator => {
                    return (
                      <Paper elevation={0} sx={{pl: 1}}>
                        <Typography variant={'body1'}> {`Indicator Name: `}<Link to={`/indicator/${encodeURIComponent(indicator._uri)}/view`} color={'blue'}>{indicator.name}</Link> </Typography>
                        <Typography variant={'body1'}> {`Unit of Measure: ${indicator.unitOfMeasure.label}`} </Typography>

                          {indicator.indicatorReports?
                              (indicator.indicatorReports.map(indicatorReport =>
                                <Typography variant={'body1'} sx={{pl: 1}}> {`Indicator Report: `}<Link
                                  to={`/indicatorReport/${encodeURIComponent(indicatorReport._uri)}/view`}
                                  color={'blue'}>{indicatorReport.name}</Link> </Typography>
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


      {outcomes.length ?
        <Paper sx={{p: 1}}>
          <Button variant="contained" color="primary" className={classes.button} onClick={generatePDFFile}>
            Generate PDF File
          </Button>
        </Paper> :
        null}

      <Paper sx={{p: 1}}>
        <Button variant="contained" color="primary" className={classes.button} onClick={() => {
          navigate('/reportGenerate');
        }} startIcon={<Undo/>}>
          Back
        </Button>
      </Paper>

    </Container>
  );

}