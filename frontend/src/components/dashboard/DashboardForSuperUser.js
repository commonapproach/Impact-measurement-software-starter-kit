import {Container} from "@mui/material";
import {Edit, Group, People, PeopleTwoTone, ViewHeadline as Log} from "@mui/icons-material";
import React from 'react';
import {NavButton} from "./NavButton";

export default function DashboardForSuperUser({}) {
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

      { <NavButton to={`/groups`} icon={<People/>}
                  text="Manage Groups"/>}

      <NavButton to={`/organizations`} icon={<People/>}
                 text="Manage Organizations"/>

      <NavButton to={`/users`} icon={<People/>}
                 text="Manage Users"/>


      {/*<NavButton to={'/characteristics'} icon={<Edit/>}*/}
      {/*           text="Manage Characteristics"/>*/}

      {/*<NavButton to={'/questions'} icon={<Edit/>}*/}
      {/*           text="Manage Questions"/>*/}

      {/*<NavButton to={'/needs'} icon={<Edit/>}*/}
      {/*           text="Manage Needs"/>*/}

      {/*<NavButton to={'/needSatisfiers'} icon={<Edit/>}*/}
      {/*           text="Manage Need Satisfiers"/>*/}

      {/*<NavButton to={'/settings/manage-forms/client'} icon={<Edit/>}*/}
      {/*           text="Manage Forms"/>*/}


    </Container>
  );
}