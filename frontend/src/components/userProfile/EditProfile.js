import React, {useEffect, useState, useContext} from 'react';
import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Container, Typography} from "@mui/material";
import {userProfileFields} from "../../constants/userProfileFields";
import {getProfile, updatePrimaryEmail, updateProfile} from "../../api/userApi";
import {isFieldEmpty, Validator} from "../../helpers";
import {
  DUPLICATE_HELPER_TEXT,
  REQUIRED_HELPER_TEXT
} from "../../constants";
import {AlertDialog} from "../shared/Dialogs";
import {Loading} from "../shared";
import LoadingButton from "../shared/LoadingButton";
import {UserContext} from "../../context";
import GeneralField from "../shared/fields/GeneralField";
import {useSnackbar} from "notistack";
import SelectField from "../shared/fields/SelectField";
import {genderOptions} from "../../store/defaults";
import AddressField from "../shared/AddressFieldField";


const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 12,
    marginRight: 12,
  }
}));

/**
 * This page allows user edit their profile information.
 * @returns {JSX.Element}
 * @constructor
 */
export default function EditProfile() {
  const classes = useStyles();
  const navigate = useNavigate();
  const {id} = useParams();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();
  const [form, setForm] = useState({
    familyName: '',
    middleName: '',
    givenName: '',
    formalName: '',
    address: {},
    gender: '',
    altEmail: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [dialogSubmit, setDialogSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState(false);
  const [dialogEmail, setDialogEmail] = useState(false);
  const [dialogQuitEdit, setDialogQuitEdit] = useState(false);


  useEffect(() => {
    getProfile(id).then(({success, person}) => {
      if (success) {
        person.phoneNumber = `+${person.phoneNumber.countryCode} (${String(person.phoneNumber.phoneNumber).slice(0, 3)}) ${String(person.phoneNumber.phoneNumber).slice(3,6)}-${String(person.phoneNumber.phoneNumber).slice(6,10)}`
        setForm({
          ...form, ...person
        });
        setLoading(false);
      }
    }).catch(e => {
      console.log(e)
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || 'Error occurs', {variant: 'error'});
    });
  }, [id]);

  /**
   * This is frontend validation for any new input information.
   * @returns {boolean}
   */
  const validate = () => {
    const newErrors = {};
    if(Validator.phone(form.phoneNumber))
      newErrors.phoneNumber = Validator.phone(form.phoneNumber);
    if(form.altEmail && Validator.email(form.altEmail))
      newErrors.altEmail = Validator.email(form.altEmail);
    if (form.gender && !genderOptions.includes(form.gender))
      newErrors.gender = 'Wrong value';
    if(form.address.postalCode && Validator.postalCode(form.address.postalCode)){
      if(!newErrors.address)
        newErrors.address = {}
      newErrors.address.postalCode = Validator.postalCode(form.address.postalCode)
    }
    if(form.address.streetNumber && isNaN(form.address.streetNumber)){
      if(!newErrors.address)
        newErrors.address = {}
      newErrors.address.streetNumber = "This must be a number"
    }

    if (Object.keys(newErrors).length !== 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  // cancel change button handler
  const handleDialogCancel = () => {
    setDialogQuitEdit(false);
    navigate('/profile/' + id);
  };



  // submit button handler
  const handleSubmitChanges = async () => {
    if (validate()) {
      setDialogSubmit(true);
    }
  };

  // confirmation dialog confirm button handler
  const handleDialogConfirm = async () => {
    try {
      const updateForm = {
        gender: form.gender,
        altEmail: form.altEmail,
        address: form.address,
      };

      if(form.phoneNumber){
        updateForm.countryCode = 1;
        updateForm.areaCode = Number(form.phoneNumber.match(/\(\d{3}\)/)[0].match(/\d{3}/)[0])
        updateForm.phoneNumber = Number(form.phoneNumber.split('(')[1].split(') ')[0] +
          form.phoneNumber.split('(')[1].split(') ')[1].split('-')[0] +
          form.phoneNumber.split('(')[1].split(') ')[1].split('-')[1])
      }

      setLoadingButton(true);

      const {success} = await updateProfile(id, updateForm);
      if (success) {
        setLoadingButton(false);
        setDialogSubmit(false);
        navigate('/profile/' + id + '/');
        enqueueSnackbar('Success', {variant: 'success'});
      }
    } catch (e) {
      console.log(e)
      setLoadingButton(false);
      setDialogSubmit(false);
      enqueueSnackbar(e.json?.message || 'Error occur', {variant: "error"})
    }
  };


  if (loading)
    return <Loading message={`Loading...`}/>;


  return (
    <Container className={classes.root}>
      <Typography variant="h4">
        {'User Profile'}
      </Typography>

      <div>
        <GeneralField
          key={'givenName'}
          label={'Given Name'}
          value={form.givenName}
          disabled
        />
        <GeneralField
          key={'familyName'}
          label={'Family Name'}
          value={form.familyName}
          disabled
        />
        {form.middleName ?
          <GeneralField
            key={'middleName'}
            label={'Middle Name'}
            value={form.middleName}
            disabled
          /> : <div/>}

        <GeneralField
          key={'phoneNumber'}
          label={'Phone Number'}
          type={'phoneNumber'}
          value={form.phoneNumber}
          onChange={value => form.phoneNumber = value.target.value}
          onBlur={e => {
            setErrors(errors => ({...errors, phoneNumber: Validator.phone(e.target.value)}));
          }}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber}
        />

        <GeneralField
          key={'altEmail'}
          label={'Alternate Email'}
          value={form.altEmail}
          onChange={value => form.altEmail = value.target.value}
          onBlur={e => {
            setErrors(errors => ({...errors, altEmail: Validator.email(e.target.value)}));
          }}
          error={!!errors.altEmail}
          helperText={errors.altEmail}
        />

        <SelectField
          key={'gender'}
          label={'Gender'}
          value={form.gender}
          onChange={value => form.gender = value.target.value}
          onBlur={e => {
            if (!genderOptions.includes(e.target.value) && e.target.value)
              setErrors(errors => ({...errors, gender: 'Wrong value'}));
          }}
          noEmpty
          error={!!errors.gender}
          helperText={errors.gender}
          options={genderOptions}
        />

        <AddressField
          label={'Address'}
          onChange={state => form.address = state}
          value={form.address}
          importErrors={errors.address}
        />


        {/* Button for cancelling account info changes */}
        <Button variant="contained" color="primary" className={classes.button}
                onClick={() => setDialogQuitEdit(true)} key={'Cancel Changes'}>
          Cancel Changes
        </Button>

        {/* Button for submitting account info changes */}
        <Button variant="contained" color="primary" className={classes.button}
                onClick={handleSubmitChanges} key={'Submit Changes'}>
          Submit Changes
        </Button>


        {/* Alert prompt for submitting changes */}
        <AlertDialog
          dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
          dialogTitle={'Are you sure you want to submit?'}
          buttons={[
            <Button onClick={() => setDialogSubmit(false)} key={'cancel'}>{'cancel'}</Button>,
            <LoadingButton noDefaultStyle variant="text" color="primary" loading={loadingButton} key={'confirm'}
                           onClick={handleDialogConfirm} children="confirm" autoFocus/>]}
          open={dialogSubmit}/>

        <AlertDialog
          dialogContentText={"All the changes you made will not be saved."}
          dialogTitle={'Notice!'}
          buttons={<Button onClick={handleDialogCancel} key={'cancelConfirm'} autoFocus> {'confirm'}</Button>}
          open={dialogQuitEdit}/>


      </div>


    </Container>
  );
}