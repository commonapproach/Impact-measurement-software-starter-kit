import React, {useContext, useState} from 'react';

import {TextField, Container, Paper, Typography, Button, Divider} from "@mui/material";
import {makeStyles} from "@mui/styles";

import {UserContext} from "../context";
import {loginSuperPassword} from "../api/auth";
import {useNavigate} from "react-router-dom";
import {navigateHelper} from "../helpers/navigatorHelper";

const useStyles = makeStyles(() => ({
  container: {
    paddingTop: 80,
    maxWidth: '500px'
  },
  paper: {
    padding: 30,
  },
  item: {
    marginTop: 20,
  },
  button: {
    marginTop: 30,
    marginBottom: 20,
  },
  link: {
    marginTop: 10,
    color: '#007dff',
  }
}));

function SuperPassword() {
  const classes = useStyles();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const userContext = useContext(UserContext);
  const [superPassword, setSuperPassword] = useState('');
  const [alert, setAlert] = useState('')

  const onChange = e => {
    setSuperPassword(e.target.value);
  };

  const submit = async () => {
    try {
      const {success} = await loginSuperPassword(superPassword);
      if (success) {
        navigate(`/login`);
      }
    } catch (e) {
      console.error(e);
      setAlert(e.json?.message)
    }
  };

  const onKeyPress = event => {
    if (event.key === "Enter") {
      submit();
    }
  };

  return (
    <Container className={classes.container} onKeyPress={onKeyPress}>
      <Paper elevation={5} className={classes.paper}>
        <TextField
          type="password"
          fullWidth
          variant="outlined"
          value={superPassword}
          onChange={onChange}
          className={classes.item}
        />
        <br/>
        <Typography variant="caption">
          <span style={{color: 'red'}}>{alert}</span>
        </Typography>
        <br/>
        <Button variant="outlined" color="primary" className={classes.button} onClick={submit}> Submit </Button>
        <Divider/>

      </Paper>
    </Container>
  );
}

export default SuperPassword;
