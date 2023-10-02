import React, {useContext} from 'react';
import {UserContext} from "../../context";
import {Button, Container, Typography} from "@mui/material";
import {Edit, FileUpload, People, Undo} from "@mui/icons-material";
import {NavButton} from "../dashboard/NavButton";
import {useNavigate} from "react-router-dom";


function ReportTypes() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{
      paddingTop: 10,
      textAlign: 'center',
    }}>


      <NavButton to={`/reportGenerate/groupMembers`} icon={<People/>} key={'Group Members'} buttonHeight={50}
                 buttonWidth={150} textSize={"small"}
                 text="Group Members"/>


      <NavButton to={`/reportGenerate/indicatorReports`} icon={<Edit/>} key={'Indicator Reports'} buttonHeight={50}
                 buttonWidth={150} textSize={"small"}
                 text="Indicator Reports"/>


      <NavButton to={`/reportGenerate/outcomeReports`} icon={<Edit/>} key={'Outcome Reports'} buttonHeight={50}
                 buttonWidth={150} textSize={"small"}
                 text="Outcome Reports"/>

      <NavButton to={'/reportGenerate/themeReports'} icon={<Edit/>} key={'Theme Reports'} buttonHeight={50}
                 buttonWidth={150} textSize={"small"} text="Theme Reports"/>

      <NavButton to={'/reportGenerate/characteristicReports'} icon={<Edit/>} key={'Characteristic Reports'} buttonHeight={50}
                 buttonWidth={150} textSize={"small"} text="Characteristic Reports"/>

      <NavButton to={'/reportGenerate/codeReports'} icon={<Edit/>} key={'Code Reports'} buttonHeight={50}
                 buttonWidth={150} textSize={"small"} text="Code Reports"/>

      <NavButton to={`/reportGenerate/stakeholderReportOutcomeReports`} icon={<Edit/>} key={'StakeholderOutcome Reports'} buttonHeight={50}
                 buttonWidth={150} textSize={"small"}
                 text="Stakeholder Outcome"/>

      {/*<NavButton to={'/organization-indicatorReports'} icon={<Edit/>} key={'indicatorReports'} buttonHeight={50}*/}
      {/*           buttonWidth={150}  textSize={"small"} text="Manage Indicator Reports"/>*/}

      <br/>
      <Button variant="outlined"
              sx={{backgroundColor: '#dda0dd', color: 'white'}}
              onClick={() => {
                navigate('/dashboard');
              }} startIcon={<Undo/>}>
        Back
      </Button>


    </Container>);

  return (
    <Container>
      <Typography
        color={'black'}
        variant="h2"
        // marginLeft={'25%'}
        textAlign="center"
        marginTop={'20%'}
      >
        {'Welcome to Pathfinder!'}
      </Typography>
    </Container>);


}

export default ReportTypes;



