import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { Button, Container, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import {
  fetchUser,
  updateUserForm,
} from "../../api/userApi";
import { Loading } from "../shared"
import { isFieldEmpty } from "../../helpers";
import {DUPLICATE_HELPER_TEXT, REQUIRED_HELPER_TEXT} from "../../constants";
import {userProfileFields} from "../../constants/userProfileFields";
import {formatPhoneNumber} from "../../helpers/phone_number_helpers";
import {AlertDialog} from "../shared/Dialogs";
import LoadingButton from "../shared/LoadingButton";
import GeneralField from "../shared/fields/GeneralField";
import Dropdown from "../shared/fields/MultiSelectField";
import {fetchUserTypes} from "../../api/userTypesApi";
import { useSnackbar } from 'notistack';

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

export default function EditUserForm() {
  const classes = useStyles();
  const navigate = useNavigate();
  const {id} = useParams();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState({});
  const [form, setForm] = useState({...userProfileFields});
  const [dialogSubmit, setDialogSubmit] = useState(false);
  const [loadingButton, setLoadingButton] = useState(false);
  const [dialogQuitEdit, setDialogQuitEdit] = useState(false);
  const [userTypeOptions, setUserTypeOptions] = useState({});
  const {enqueueSnackbar} = useSnackbar();

  useEffect(() => {
    fetchUser(id).then(res => {
      if(res.success) {
        const user = res.user
        setUser(user);
        setForm({
          // givenName: (user.primaryContact && user.primaryContact.givenName) ?
          //   user.primaryContact.givenName : 'Not Provided',
          // familyName: (user.primaryContact && user.primaryContact.familyName) ?
          //   user.primaryContact.familyName : 'Not Provided',
          email: user.email,
          userTypes: user.userTypes,
          // telephone: (user.primaryContact && user.primaryContact.telephone) ?
          //   formatPhoneNumber(user.primaryContact.telephone) : 'Not Provided'
        })
      }
    }).then(() => {
      fetchUserTypes().then(({userTypes})=>{
        setUserTypeOptions(userTypes);
      })
    }).then(() => {
      setLoading(false);
    }).catch(e => {
      setErrors(e.json);
      setLoading(false);
      navigate('/dashboard');
      enqueueSnackbar(errors.message || 'Error occurs', {variant: 'error'})
    });
  }, [id]);

  /**
   * @returns {boolean} true if valid.
   */
  const validate = () => {
    const newErrors = {};
    if(form.userTypes.length === 0){
      newErrors.userTypes = 'This field cannot be empty';
    }
    // for (const [field, option] of Object.entries(userProfileFields)) {
    //   const isEmpty = isFieldEmpty(form[field]);
    //
    //   if (option.required && isEmpty) {
    //     newErrors[field] = REQUIRED_HELPER_TEXT;
    //   }
    //   let msg;
    //   if (!isEmpty && option.validator && (msg = option.validator(form[field]))) {
    //     newErrors[field] = msg;
    //   }
    //
    //   if (option.label === 'Secondary Email') {
    //     if (form.email === form.altEmail) {
    //       newErrors[field] = DUPLICATE_HELPER_TEXT;
    //     }
    //   }
    //
    // }
    if (Object.keys(newErrors).length !== 0) {
      setErrors(newErrors);
      return false
    }
    return true;
  };

  /**
   * handler of onBlur.
   * @param e
   * @param field
   * @param option
   */
  const handleOnBlur = (e, field, option) => {
    if (!isFieldEmpty(form[field]) && option.validator && !!option.validator(form[field])){
      setErrors({...errors, [field]: option.validator(form[field])});
    } else {
      setErrors({...errors, [field]: undefined});
    }
  };


  // submit button handler
  const handleSubmitChanges = () => {
    if (validate()) {
      setDialogSubmit(true);
    }
  }

  // confirmation dialog confirm button handler
  const handleDialogConfirm = async () => {
    try{
      setLoadingButton(true);

      // Phone number parse.
      // let phoneUnchanged;
      // if (!form.telephone) {
      //   phoneUnchanged = null;
      // } else {
      //   phoneUnchanged = user.primaryContact.telephone.countryCode.toString() +
      //     user.primaryContact.telephone.areaCode.toString() + user.primaryContact.telephone.phoneNumber.toString()
      // }
      // console.log('This is form.telephone:', form.telephone)
      // console.log("phone not changed:", phoneUnchanged)
      const updateForm = {
        email: form.email,
        userTypes: form.userTypes
      }

      console.log(updateForm)
      // if (form.telephone === phoneUnchanged) {
      //   updateForm.countryCode = parseInt(form.telephone.slice(0,1));
      //   updateForm.areaCode = parseInt(form.telephone.slice(1,4));
      //   updateForm.phoneNumber = parseInt(form.telephone.slice(4,11));
      // } else {
      //   const phone = form.telephone.split(' ');
      //   updateForm.countryCode = parseInt(phone[0]);
      //   updateForm.areaCode = parseInt(phone[1].slice(1,4));
      //   updateForm.phoneNumber = parseInt(phone[2].slice(0,3) + phone[2].slice(4,8));
      // }
      const {success} = await updateUserForm(id, updateForm);
      if (success) {
        setLoadingButton(false);
        setDialogSubmit(false);
        navigate('/users/');
        enqueueSnackbar('Success', {variant: 'success'});
      }
    } catch (e){
      setLoadingButton(false);
      setDialogSubmit(false);
      enqueueSnackbar(e.json.message || 'Error occurs', {variant: 'error'})
    }
  };

  if (loading)
    return <Loading message={`Loading...`}/>;

  return (
    <Container className={classes.root}>
      <Typography variant="h5">
        {'Edit user'}
      </Typography>

      <GeneralField
        key={'email'}
        label = {'Email'}
        type = {'text'}
        value = {form.email}
        disabled
        onChange={e => form.email = e.target.value}
        error={!!errors.email}
        helperText={errors.email}
        />

      <Dropdown
        label="User Types"
        key={'userTypes'}
        value={form.userTypes}
        onChange={e => {
          form.userTypes = e.target.value
        }}
        options={userTypeOptions}
        onBlur = {() => {
          if(form.userTypes.length === 0) {
            setErrors(errors => ({...errors, 'userTypes': 'This field is required'}));
          } else {
            setErrors(errors => ({...errors, 'userTypes': null}));
          }
        }
        }
        error={!!errors.userTypes}
        helperText={errors.userTypes}
        // sx={{mb: 2}}
        noEmpty
        required = {true}
      />

      {/* Button for cancelling account info changes */}
      <Button variant="contained" color="primary" className={classes.button}
              onClick={() => navigate('/users/')}>
        Cancel Changes
      </Button>

      {/* Button for submitting account info changes */}
      <Button variant="contained" color="primary" className={classes.button}
              onClick={handleSubmitChanges} key={'Submit Changes'}>
        Submit Changes
      </Button>


      {/* Alert prompt for submitting changes */}
      <AlertDialog
        dialogContentText={"Note that if you are changing the profile information for user:" + user.primaryEmail}
        dialogTitle={'Are you sure you want to submit?'}
        buttons={[
          <Button onClick={() => setDialogSubmit(false)} key={'cancel'}>{'cancel'}</Button>,
          //<Button onClick={handleDialogConfirm} key={'confirm'} autoFocus> {'confirm'}</Button>,
          <LoadingButton noDefaultStyle variant="text" color="primary" loading ={loadingButton} key={'confirm'}
                         onClick={handleDialogConfirm} children='confirm' autoFocus/>]}
        open={dialogSubmit}/>


    </Container>
  )
}