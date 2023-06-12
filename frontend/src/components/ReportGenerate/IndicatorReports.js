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


export default function IndicatorReports_ReportGenerate() {

  const classes = useStyles();
  const navigate = useNavigate();



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
    pdf.text("Indicator Reports", x, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.text(`Generated at ${(new Date).toLocaleString()}`, x, y);
    y += 10;
    indicators?.map(indicator => {
      x = 23;
      y += 6
      pdf.text(`Indicator Name: ${indicator.name}`, x, y)
      y += 6;
      pdf.text(`Unit of Measure: ${indicator.unitOfMeasure.label}`, x, y);
      y += 6;
      indicator.indicatorReports?.map(indicatorReport => {
        x = 26
        pdf.text(`Indicator Report Name: ${indicatorReport.name}`, x, y)
        y += 6
      })
    })
    pdf.save('indicator report.pdf');

  }


  const [organizations, setOrganizations] = useState({});
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);



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
      fetchIndicators(encodeURIComponent(selectedOrganization)).then(({success, indicators}) => {
        if (success) {
          setIndicators(indicators);
        }
      });
    }
  }, [selectedOrganization]);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Indicators </Typography>

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
        {indicators.length ? indicators.map((indicator, index) => {
          return (

            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'h6'}> {`Indicator: ${indicator.name}`}  </Typography>
               <Typography variant={'body1'}> {'Name: '}<Link to={`/indicator/${encodeURIComponent(indicator._uri)}/view`} color={'blue'}>{indicator.name}</Link> </Typography>
              <Typography variant={'body1'}> {`Unit of Measure: ${indicator.unitOfMeasure.label}`} </Typography>

              {indicator.indicatorReports?


                  (indicator.indicatorReports.map(indicatorReport => {
                    return (
                        <Typography variant={'body1'} sx={{pl:2}}> {`Indicator Report Name: `} <Link
                          to={`/indicatorReport/${encodeURIComponent(indicatorReport._uri)}/view`}
                          color={'blue'}>{indicatorReport.name}</Link> </Typography>
                      );
                  }))
                 : null
                  }



            </Paper>

          );
        }) : null}

      </Paper>


      {indicators.length ?
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