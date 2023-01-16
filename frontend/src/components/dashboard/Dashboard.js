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

      {userContext.userTypes.includes('superuser') || userContext.userTypes.includes('groupAdmin')?
        <NavButton to={`/groups`} icon={<People/>} key={'groups'}
                  text="Manage Groups"/>:<div/>}

      {userContext.userTypes.includes('superuser') || userContext.userTypes.includes('admin')?
        <NavButton to={`/organizations`} icon={<People/>} key={'organizations'}
                  text="Manage Organizations"/>:
      <div/>}

      {userContext.userTypes.includes('superuser')?<NavButton to={`/users`} icon={<People/>} key={'users'}
                  text="Manage Users"/>:<div/>}


      <NavButton to={'/domains'} icon={<Edit/>} key={'domains'}
                 text="Manage Domains"/>

      {/*<NavButton to={'/needs'} icon={<Edit/>}*/}
      {/*           text="Manage Needs"/>*/}

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
