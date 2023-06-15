import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import {useSnackbar} from "notistack";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {PictureAsPdf, Undo} from "@mui/icons-material";
import {fetchOutcomesThroughTheme} from "../../api/outcomeApi";
import {fetchThemes} from "../../api/themeApi";
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


export default function ThemeReports() {

  const classes = useStyles();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();
  const mode = '';

  const [themes, setThemes] = useState({});
  const [selectedTheme, setSelectedTheme] = useState('');
  const [outcomes, setOutcomes] = useState([])
  const [loading, setLoading] = useState(true);


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
      fetchOutcomesThroughTheme(encodeURIComponent(selectedTheme)).then(({success, outcomes}) => {
        if (success) {
          setOutcomes(outcomes)
        }
      });
    } else {
      setOutcomes([])
    }
  }, [selectedTheme]);


  useEffect(() => {
      fetchThemes().then(({success, themes}) => {
        if (success) {
          console.log(themes);
          const themeOps = {};
          themes.map(theme => {
            themeOps[theme._uri] = theme.name
          })
          setThemes(themeOps);
          setLoading(false);
        }
      })
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
                  onClick={generatePDFFile} startIcon={<PictureAsPdf />}>
            Generate PDF File
          </Button>
          :
          null}

        <SelectField
          key={'theme'}
          label={'Theme'}
          value={selectedTheme}
          options={themes}
          onChange={e => {
            setSelectedTheme(
              e.target.value
            );
          }}
        />

        {outcomes.length ? outcomes.map((outcome, index) => {
          return (
            <Paper sx={{p: 2}} variant={'outlined'}>
              <Typography variant={'body1'}> {'Name: '}<Link to={`/outcome/${encodeURIComponent(outcome._uri)}/view`} color={'blue'}>{outcome.name}</Link> </Typography>
              {outcome.indicators?
                <Paper elevation={0}>
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