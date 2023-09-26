import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import {useSnackbar} from "notistack";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {FileDownload, PictureAsPdf, Undo} from "@mui/icons-material";
import {fetchOutcomesThroughTheme} from "../../api/outcomeApi";
import {fetchTheme, fetchThemes} from "../../api/themeApi";
import {jsPDF} from "jspdf";
import {reportErrorToBackend} from "../../api/errorReportApi";

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


export default function ThemeReports() {

  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();

  const [themes, setThemes] = useState({});
  const [selectedTheme, setSelectedTheme] = useState('');
  const [theme, setTheme] = useState({})
  const [outcomes, setOutcomes] = useState([])
  const [loading, setLoading] = useState(true);


  const generateTXTFile = () => {
    let str = ''
    const addLine = (line, space) => {
      if (space)
        [...Array(space).keys()].map(() => {
          str += ' '
        })
      str += line + '\n';
    }

    outcomes.map((outcome, index) => {
      addLine(`Outcome: ${outcome.name}`, 2);
      outcome.indicators.map(indicator => {
        addLine(`Indicator Name: ${indicator.name}`, 6);
        addLine(`Unit of Measure: ${indicator.unitOfMeasure.label}`, 10);
        indicator.indicatorReports.map(indicatorReport =>{
          addLine(`Indicator Report: ${indicatorReport.name}`, 10);
          addLine(`Value: ${indicatorReport.value.numericalValue}`, 14);
          addLine(`Time Interval: ${(new Date(indicatorReport.hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(indicatorReport.hasTime.hasEnd.date)).toLocaleString()}`, 14)
        })
      })
    })

    {outcomes.length ? outcomes.map((outcome, index) => {
      return (
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'body1'}> {'Name: '}<Link to={`/outcome/${encodeURIComponent(outcome._uri)}/view`} color={'blue'}>{outcome.name}</Link> </Typography>
          {outcome.indicators?
            <Paper elevation={0}>
              {outcome.indicators.map(indicator => {
                return (
                  <Paper elevation={0} sx={{pl: 4}}>
                    <Typography variant={'body1'}> {`Indicator Name: `}<Link to={`/indicator/${encodeURIComponent(indicator._uri)}/view`} color={'blue'}>{indicator.name}</Link> </Typography>
                    <Typography variant={'body1'} sx={{pl:4}}> {`Unit of Measure: ${indicator.unitOfMeasure?.label}`} </Typography>

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


    const file = new Blob([str], { type: 'text/plain' });
    saveAs(file, 'themeReport.txt');
  }

  const generatePDFFile = () => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'b5',
      putOnlyUsedFonts:true
    });
    let x = 20
    let y = 20
    pdf.setFontSize(20);
    pdf.text("Theme Reports", x, y);
    pdf.setFontSize(10);
    y += 6;
    pdf.text(`Generated at ${(new Date).toLocaleString()}`, x, y);
    y += 10;
    pdf.text(`Theme Name: ${themes[selectedTheme]}`, x, y);
    y += 6;
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
    pdf.save('theme report.pdf');
  }



  useEffect(() => {
    if (selectedTheme) {
      Promise.all([fetchOutcomesThroughTheme(encodeURIComponent(selectedTheme)), fetchTheme(encodeURIComponent(selectedTheme))]).
      then(([outcomeRet, themeRet]) => {
        if (outcomeRet.success && themeRet.success){
          setOutcomes(outcomeRet.outcomes)
          setTheme(themeRet.theme)
        }
      }).catch(() => {
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching outcomes and themes", {variant: 'error'});
      })
    } else {
      setOutcomes([]);
      setTheme({})
    }
  }, [selectedTheme]);


  useEffect(() => {
      fetchThemes().then(({success, themes}) => {
        if (success) {
          const themeOps = {};
          themes.map(theme => {
            themeOps[theme._uri] = theme.name
          })
          setThemes(themeOps);
          setLoading(false);
        }
      }).catch(e => {
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching themes", {variant: 'error'});
      });
  }, []);

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'} sx={{position: 'relative'}}>
        <Typography variant={'h4'}> Themes </Typography>
        <Button variant="outlined"  sx={{position: 'absolute', right:0, marginTop:1.5, backgroundColor:'#dda0dd', color:'white'}} onClick={() => {
          navigate('/reportGenerate');
        }} startIcon={<Undo />}>
          Back
        </Button>
        {!!selectedTheme ?
          <Button variant="contained" color="primary" className={classes.button} sx={{position: 'absolute', right:100, marginTop:0}}
                  onClick={generateTXTFile} startIcon={<FileDownload />}>
            Generate TXT File
          </Button>
          :
          null}

        <SelectField
          key={'theme'}
          label={'Theme'}
          value={selectedTheme}
          options={themes}
          defaultOptionTitle={'Select a theme'}
          onChange={e => {
            setSelectedTheme(
              e.target.value
            );
          }}
        />
        {!!selectedTheme?
          <Paper elevation={0}>
          <Typography variant={'body1'} sx={{pl: 4}}>{`Theme Name: `} <Link to={`/theme/${encodeURIComponent(theme._uri)}/view`} color={'#2f5ac7'} colorWithHover>{theme.name || 'Not Given'}</Link> </Typography>
          <Typography variant={'body1'} sx={{pl:4}}> {`Description: ${theme.description || 'Not Given'}`} </Typography>
          </Paper>
          : null}

        {outcomes.length? <Typography sx={{pl:4}} variant={'h5'} > {'Outcomes:'} </Typography>:null}

        {outcomes.length ? outcomes.map((outcome, index) => {
          return (
            <Paper sx={{p: 2, pl:8}} variant={'outlined'}>
              <Typography variant={'body1'}> {'Name: '}<Link to={`/outcome/${encodeURIComponent(outcome._uri)}/view`} color={'#2f5ac7'} colorWithHover>{outcome.name}</Link> </Typography>
              {outcome.indicators?
                <Paper elevation={0}>
                  {outcome.indicators.map(indicator => {
                    return (
                      <Paper elevation={0} sx={{pl: 4}}>
                        <Typography variant={'body1'}> {`Indicator Name: `}<Link to={`/indicator/${encodeURIComponent(indicator._uri)}/view`} color={'blue'}>{indicator.name}</Link> </Typography>
                        <Typography variant={'body1'} sx={{pl:4}}> {`Unit of Measure: ${indicator.unitOfMeasure?.label || 'Not Given'}`} </Typography>

                        {indicator.indicatorReports?
                          (indicator.indicatorReports.map(indicatorReport =>
                            <Paper elevation={0} sx={{pl: 4}}>
                              <Typography variant={'body1'}> {`Indicator Report: `}<Link
                                to={`/indicatorReport/${encodeURIComponent(indicatorReport._uri)}/view`}
                                color={'#2f5ac7'} colorWithHover>{indicatorReport.name}</Link> </Typography>
                              <Typography variant={'body1'} sx={{pl: 4}}> {`Value: ${indicatorReport.value?.numericalValue}`} </Typography>
                              {indicatorReport.hasTime? <Typography variant={'body1'}
                                           sx={{pl: 4}}> {`Time Interval: ${(new Date(indicatorReport.hasTime?.hasBeginning.date)).toLocaleString()} to ${(new Date(indicatorReport.hasTime?.hasEnd.date)).toLocaleString()}`} </Typography>:null}
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


      {/*{!!selectedTheme ?*/}
      {/*  <Paper sx={{p: 1}}>*/}
      {/*    <Button variant="contained" color="primary" className={classes.button} onClick={pdfGenerator}>*/}
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