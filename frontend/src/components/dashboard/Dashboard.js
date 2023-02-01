import React, {useContext} from 'react';
import {Link} from '../shared';

import {Container, Button, Typography} from "@mui/material";
import {Edit, Create, People, ViewHeadline as Log, CheckCircleOutline as Criteria} from "@mui/icons-material";
import {UserContext} from "../../context";
import DashboardForSuperUser from "./DashboardForSuperUser";
import {NavButton} from "./NavButton";


function Dashboard() {
  const userContext = useContext(UserContext);

  // if (userContext.userTypes.includes('superuser'))
  //   return <DashboardForSuperUser/>;

  return (
    <Container maxWidth="md" sx={{
      paddingTop: 8,
      textAlign: 'center',
    }}>

      {/*{!organization.id &&*/}
      {/*  <NavButton to={{pathname: '/providers/organization/new', state: {status: 'Home Agency'}}}*/}
      {/*             text="Create Organization Profile for Home Agency" icon={<Create/>}/>}*/}

      {/*{organization.id &&*/}
      {/*  <NavButton to={`/provider/${organization.id}/edit/organization`} icon={<Edit/>}*/}
      {/*             text="Edit Organization Profile for Home Agency"/>}*/}

      {userContext.isSuperuser || userContext.groupAdminOf.length > 0?
        <NavButton to={`/groups`} icon={<People/>} key={'groups'}
                  text="Manage Groups"/>:null}

      {userContext.isSuperuser || userContext.administratorOf.length > 0?
        <NavButton to={`/organizations`} icon={<People/>} key={'organizations'}
                  text="Manage Organizations"/>:
      null}

      {userContext.isSuperuser?<NavButton to={`/users`} icon={<People/>} key={'users'}
                  text="Manage Users"/>:null}

      {userContext.researcherOf.length > 0?
        <NavButton to={`/groups`} icon={<Edit/>} key={'indicators'}
                   text="Manage Indicators"/>:null}

      {userContext.researcherOf.length > 0?
        <NavButton to={`/groups`} icon={<Edit/>} key={'indicator reports'}
                   text="Manage Indicator Reports"/>:null}

      {userContext.researcherOf.length > 0?
        <NavButton to={`/groups`} icon={<Edit/>} key={'outcomes'}
                   text="Manage Outcomes"/>:null}


      <NavButton to={'/domains'} icon={<Edit/>} key={'domains'}
                 text="Manage Domains"/>

      <NavButton to={'/organization-indicators'} icon={<Edit/>} key={'organization-indicators'}
                 text="Manage Indicators"/>

      {/*<NavButton to={'/needSatisfiers'} icon={<Edit/>}*/}
      {/*           text="Manage Need Satisfiers"/>*/}

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

export default Dashboard;
