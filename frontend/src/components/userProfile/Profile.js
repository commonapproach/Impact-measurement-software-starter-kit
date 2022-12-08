import React, {useEffect, useState, useContext} from 'react';
import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import {Box, Button, Container, Typography} from "@mui/material";
import {userProfileFields} from "../../constants/userProfileFields";
import {getProfile} from "../../api/userApi";
import {Link, Loading} from "../shared";
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";
import {getInstancesInClass} from "../../api/dynamicClassInstance";


function NavButton({to, text}) {
  return (
    <Link to={to}>
      <Button
        variant="contained"
        color="primary"
        style={{display: 'block', width: 'inherit', marginTop: '10px', marginBottom: '20px'}}>
        {text}
      </Button>
    </Link>
  );
}

const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 12,
  },

}));

/**
 * This page is for displaying user profile, with option of resetting password.
 * @returns {JSX.Element}
 * @constructor
 */
export default function Profile() {

  const classes = useStyles();
  const navigate = useNavigate();
  const {id} = useParams();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({streetType: {}, streetDirection: {}, state: {}});
  const [form, setForm] = useState({
    familyName: '',
    middleName: '',
    givenName: '',
    formalName: '',
    address: '',
    gender: '',
    altEmail: '',
    phoneNumber: '',
  });

  useEffect(() => {
    Promise.all([
      getInstancesInClass('ic:StreetType')
        .then(streetType => {
          setOptions(options => ({...options, streetType}));
        }),
      getInstancesInClass('ic:StreetDirection')
        .then(streetDirection => {
          setOptions(options => ({...options, streetDirection}));
        }),
      getInstancesInClass('schema:State')
        .then(state => {
          setOptions(options => ({...options, state}));
        }),
    ]).then(() => {
      if (id !== userContext.id) {
        navigate('/dashboard');
        enqueueSnackbar('A user can only visualize its own profile.', {variant: 'error'});
      }
      getProfile(id).then(({success, person}) => {
        if (success) {
          if(person.phoneNumber)
            person.phoneNumber = `+ ${person.phoneNumber.countryCode} ${person.phoneNumber.phoneNumber}`;
          setForm({
            ...form, ...person,
          });
          setLoading(false);
        }
      });
    }).catch(e => {
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || 'Error occurs', {variant: 'error'});
    });
  }, [id]);

  // goes to edit page
  const handleEdit = () => {
    navigate('/profile/' + id + '/edit');
  };

  if (loading)
    return <Loading message={`Loading...`}/>;

  return (
    <Container className={classes.root}>
      <Typography variant="h4" key={'Profile Title'}>
        {'User Profile'}
      </Typography>

      <div>
        <Box sx={{
          backgroundColor: 'transparent',
          width: 'max-content',
          paddingTop: 3,
          borderBlockColor: 'grey',
          borderRadius: 2
        }}>
          {/* account information display */}

          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'givenName'}>
              {'Given Name'} : {form.givenName}
            </Typography>
          </div>
          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'middleName'}>
              {'Middle Name'} : {form.middleName}
            </Typography>
          </div>
          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'familyName'}>
              {'Family Name'} : {form.familyName}
            </Typography>
          </div>
          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'formalName'}>
              {'Formal Name'} : {form.formalName}
            </Typography>
          </div>
          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'gender'}>
              {'Gender'} : {form.gender}
            </Typography>
          </div>
          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'altEmail'}>
              {'Alternate Email'} : {form.altEmail}
            </Typography>
          </div>
          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'address'}>
              {'Address'} : {form.address? `${form.address.unitNumber}-${form.address.streetNumber} 
          ${form.address.streetName} ${options.streetType[form.address.streetType]} ${options.streetDirection[form.address.streetDirection]}, 
          ${form.address.city}, ${options.state[form.address.state]}, ${form.address.postalCode}`: ''}
            </Typography>
          </div>
          <div>
            <Typography
              style={{padding: 10, fontSize: 'large'}} key={'phoneNumber'}>
              {'PhoneNumber'} : {form.phoneNumber}
            </Typography>
          </div>

        </Box>

        {/* Button for Edit Profile */}
        <Button variant="contained" color="primary" className={classes.button}
                onClick={handleEdit} key={'Edit Profile'}>
          Edit Profile
        </Button>

        <Box sx={{
          backgroundColor: 'transparent',
          width: 'max-content',
          paddingTop: 3,
          borderBlockColor: 'grey',
          borderRadius: 2
        }}>
          <Typography variant="h6"
                      style={{marginTop: '10px'}}
                      key={'Reset Password Text'}>
            {'Want to change your password? Click below:'}
          </Typography>

          {/* Button for password reset */}
          <NavButton to={'/profile/reset-password/' + id}
                     text={'Reset Password'}
                     key={'Reset Password'}/>
        </Box>

        <Box sx={{
          backgroundColor: 'transparent',
          width: 'max-content',
          paddingTop: 3,
          borderBlockColor: 'grey',
          borderRadius: 2
        }}>
          <Typography variant="h6"
                      style={{marginTop: '10px'}}
                      key={'Reset Password Text'}>
            {'Want to change your security questions? Click below:'}
          </Typography>

          {/* Button for password reset */}
          <NavButton to={'/profile/reset-securityQuestions/' + id}
                     text={'Reset Security Questions'}
                     key={'Reset Security Questions'}/>
        </Box>
      </div>
    </Container>
  );
}