import React, {useContext} from 'react';
import {Link} from '../shared';

import {Container, Button, Typography} from "@mui/material";
import {Edit, Create, People, ViewHeadline as Log, CheckCircleOutline as Criteria} from "@mui/icons-material";
import {UserContext} from "../../context";
import DashboardForSuperUser from "./DashboardForSuperUser";


function Dashboard() {
  const userContext = useContext(UserContext);
  console.log(userContext);

  if (userContext.userType === 'superuser')
    return <DashboardForSuperUser/>;

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
