import React, {useContext} from 'react';
import {UserContext} from "../../context";
import {Container, Typography} from "@mui/material";
import {Edit, FileUpload, People, Undo} from "@mui/icons-material";
import {NavButton} from "../dashboard/NavButton";


function ReportTypes() {
  const userContext = useContext(UserContext);

  return (
    <Container maxWidth="sm" sx={{
      paddingTop: 10,
      textAlign: 'center',
    }}>



        <NavButton to={`/reportGenerate/groupMembers`} icon={<People/>} key={'Group Members'} buttonHeight={50} buttonWidth={150} textSize={"small"}
                   text="Group Members"/>


        <NavButton to={`/reportGenerate/indicatorReports`} icon={<Edit/>} key={'Indicator Reports'} buttonHeight={50} buttonWidth={150}  textSize={"small"}
                   text="Indicator Reports"/>


        <NavButton to={`/reportGenerate/outcomeReports`} icon={<Edit/>} key={'Outcome Reports'} buttonHeight={50} buttonWidth={150}  textSize={"small"}
                   text="Outcome Reports"/>

      {/*<NavButton to={'/organization-indicators'} icon={<Edit/>} key={'Theme Reports'} buttonHeight={50}*/}
      {/*           buttonWidth={150}  textSize={"small"} text="Theme Reports"/>*/}

      {/*<NavButton to={'/organization-outcomes'} icon={<Edit/>} key={'organization-outcomes'} buttonHeight={50}*/}
      {/*           buttonWidth={150}  textSize={"small"}  text="Theme Report"/>*/}

      {/*<NavButton to={'/organization-indicatorReports'} icon={<Edit/>} key={'indicatorReports'} buttonHeight={50}*/}
      {/*           buttonWidth={150}  textSize={"small"} text="Manage Indicator Reports"/>*/}

      <NavButton to={'/dashboard'} icon={<Undo/>} key={'themes'} buttonHeight={50} buttonWidth={150} textSize={"small"}
                 text="Back" />

      {/*<NavButton to={'/fileUploading'} icon={<FileUpload/>} key={'fileUploading'} disabled buttonHeight={50}*/}
      {/*           buttonWidth={150}  textSize={"small"}  text="File Upload"/>*/}






      {/*<NavButton to={'/settings/manage-forms/client'} icon={<Edit/>}*/}
      {/*           text="Manage Forms"/>*/}


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



