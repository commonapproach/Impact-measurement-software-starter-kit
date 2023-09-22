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
import {fetchIndicators} from "../../api/indicatorApi";
import {jsPDF} from "jspdf";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {useSnackbar} from "notistack";
import {fetchCodes} from "../../api/codeAPI";

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


export default function Code_ReportGenerate() {

  const classes = useStyles();
  const navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar();


  const [codes, setCodes] = useState([]);
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
    // const pdf = new jsPDF({
    //   orientation: 'p',
    //   unit: 'mm',
    //   format: 'a5',
    //   putOnlyUsedFonts:true
    // });


    // let x = 20
    // let y = 20
    // pdf.setFontSize(20);
    // pdf.text("Indicator Reports", x, y);
    // y += 6;
    // pdf.setFontSize(10);
    // pdf.text(`Generated at ${(new Date).toLocaleString()}`, x, y);
    // y += 10;
    // indicators?.map(indicator => {
    //   x = 23;
    //   y += 6
    //   pdf.text(`Indicator Name: ${indicator.name}`, x, y)
    //   y += 6;
    //   pdf.text(`Unit of Measure: ${indicator.unitOfMeasure.label}`, x, y);
    //   y += 6;
    //   indicator.indicatorReports?.map(indicatorReport => {
    //     x = 26
    //     pdf.text(`Indicator Report Name: ${indicatorReport.name}`, x, y)
    //     y += 6
    //   })
    // })
    // pdf.save('indicator report.pdf');

    // indicators.map(indicator => {
    //   addLine(`Indicator: ${indicator.name || ''}`, 2);
    //   addLine(`Unit of Measure: ${indicator.unitOfMeasure?.label || ''}`, 6);
    //   indicator.indicatorReports.map(indicatorReport => {
    //     addLine(`Indicator Report: ${indicatorReport.name || ''}`, 6);
    //     addLine(`Value: ${indicatorReport.value?.numericalValue || ''}`, 10);
    //     addLine(indicatorReport.hasTime ? `Time Interval: ${(new Date(indicatorReport.hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(indicatorReport.hasTime.hasEnd.date)).toLocaleString()}` : '', 10);
    //   });
    // });
    //
    // const file = new Blob([str], {type: 'text/plain'});
    // saveAs(file, 'indicatorReport.txt');
  };


  useEffect(() => {
    fetchCodes().then(({success, codes}) => {
      if (success) {
        setCodes(codes);
        setLoading(false)
      }
    }).catch(e => {
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching indicators", {variant: 'error'});
    });
  }, []);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'} sx={{position: 'relative'}}>
        <Typography variant={'h4'}> Codes </Typography>

        <Button variant="outlined"
                sx={{position: 'absolute', right: 0, marginTop: 1.5, backgroundColor: '#dda0dd', color: 'white'}}
                onClick={() => {
                  navigate('/reportGenerate');
                }} startIcon={<Undo/>}>
          Back
        </Button>
        {codes.length ?
          <Button variant="contained" color="primary" className={classes.button}
                  sx={{position: 'absolute', right: 100, marginTop: 0}}
                  onClick={generateTXTFile} startIcon={<FileDownload/>}>
            Generate TXT File
          </Button>
          :
          null}
        {codes.length ? codes.map((code, index) => {
          return (

            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'h6'}> {`Code: ${code.name || 'Name Not Given'}`}  </Typography>
              <Typography variant={'body1'} sx={{pl: 4}}> {'Name: '}<Link
                to={`/code/${encodeURIComponent(code._uri)}/view`} colorWithHover
                color={'#2f5ac7'}>{code.name || 'Name Not Given'}</Link> </Typography>
              <Typography variant={'body1'}
                          sx={{pl: 4}}> {`Value: ${code.codeValue || 'Not Given'}`} </Typography>
              <Typography variant={'body1'}
                          sx={{pl: 4}}> {`Identifier: ${code.identifier || 'Not Given'}`} </Typography>
              <Typography variant={'body1'}
                          sx={{pl: 4}}> {`Specification: ${code.specification || 'Not Given'}`} </Typography>
            </Paper>

          );
        }) : null}

      </Paper>


      {/*{indicators.length ?*/}
      {/*  <Paper sx={{p: 1}} elevation={0}>*/}
      {/*    <Button variant="contained" color="primary" className={classes.button}*/}
      {/*            onClick={generatePDFFile} startIcon={<PictureAsPdf />}>*/}
      {/*      Generate PDF File*/}
      {/*    </Button>*/}
      {/*  </Paper> :*/}
      {/*  null}*/}

      {/*<Paper sx={{p: 1}}>*/}
      {/*  <Button variant="contained" color="primary" className={classes.button} onClick={() => {*/}
      {/*    navigate('/reportGenerate');*/}
      {/*  }} startIcon={<Undo/>}>*/}
      {/*    Back*/}
      {/*  </Button>*/}
      {/*</Paper>*/}

    </Container>
  );

}