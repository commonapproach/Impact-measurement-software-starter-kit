import React, {useEffect, useState, useContext} from 'react';
import {makeStyles} from "@mui/styles";
import {Button, Container, Typography} from "@mui/material";
import {Validator} from "../../helpers";
import {useNavigate} from "react-router-dom";
import {AlertDialog} from "../shared/Dialogs";
import {useParams} from "react-router-dom";
import {updatePassword} from "../../api/userApi";
import LoadingButton from "../shared/LoadingButton";
import PasswordHint from "../shared/PasswordHint";
import GeneralField from "../shared/fields/GeneralField";
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";


const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 12,
  }
}));

/**
 * This function is for reset password in user profile page.
 * @returns {JSX.Element}
 * @constructor
 */
export default function UserResetPassword() {
  const classes = useStyles();
  const {id} = useParams();
  const [errors, setErrors] = useState({});
  const [dialogSubmit, setDialogSubmit] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    repeatNewPassword: ''
  });
  const [loadingButton, setLoadingButton] = useState(false);
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();


  useEffect(() => {
    if (id !== userContext.id) {
      navigate('/dashboard');
      enqueueSnackbar('A user can only update its own password.', {variant: 'error'});
    }
  }, [id]);
  /**
   * This validates the correctness of new password.
   * @returns {boolean}
   */
  const validate = () => {
    const newErrors = {};
    if (!form.currentPassword) {
      newErrors.currentPassword = "This field is required.";
    }
    if (!form.newPassword) {
      newErrors.newPassword = 'This field is required.';
    } else if (Validator.password(form.newPassword)) {
      newErrors.newPassword = Validator.password(form.newPassword);
    }
    if (!form.repeatNewPassword) {
      newErrors.repeatNewPassword = 'This field is required.';
    } else if (form.newPassword !== form.repeatNewPassword) {
      newErrors.repeatNewPassword = 'This field must be same with the New Password you entered';
    }

    if (Object.keys(newErrors).length !== 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };


  /**
   * handler for submit new password.
   */
  const handleSubmit = () => {
    if (validate()) {
      setDialogSubmit(true);
    }
  };


  /**
   * handler for the confirm button in the dialog pops after click submit new password.
   * @returns {Promise<void>}
   */
  const handleConfirm = async () => {
    try {
      setLoadingButton(true);
      const res = await updatePassword(id, {
        currentPassword: form.currentPassword, newPassword: form.newPassword
      });
      setLoadingButton(false);
      setDialogSubmit(false);
      if (res.success) {
        navigate("/profile/" + id);
        enqueueSnackbar(res.message || 'Success!', {variant: 'success'});
      } else if (res.wrongCurrentPassword) {
        setErrors(errors => ({...errors, currentPassword: res.message || "Wrong current password."}));
      }
    } catch (e) {
      setLoadingButton(false);
      setDialogSubmit(false);
      enqueueSnackbar(e.json?.message || 'Error occurs', {variant: 'error'});
    }
  };


  return (
    <Container className={classes.root}>
      <Typography variant="h5"
                  style={{marginTop: '20px'}}>
        {'Please enter your current password:'}
      </Typography>
      <GeneralField
        id={'currentPassword'}
        label={'current Password'}
        required
        onChange={e => form.currentPassword = e.target.value}
        value={form.currentPassword}
        error={!!errors.currentPassword}
        helperText={errors.currentPassword}
        // onBlur={e => {
        //   if(e.target.value && Validator.password(e.target.value)){
        //     setErrors(errors => ({...errors, currentPassword: Validator.password(e.target.value)}))
        //   } else {
        //     setErrors(errors => ({...errors, currentPassword: null}))
        //   }
        // }}
        type={'password'}
      />
      <PasswordHint/>
      <Typography variant="h5"
                  style={{marginTop: '20px'}}>
        {'Please enter your new password:'}
      </Typography>
      <GeneralField
        id={'newPassword'}
        label={'new Password'}
        required
        onChange={e => form.newPassword = e.target.value}
        value={form.newPassword}
        error={!!errors.newPassword}
        helperText={errors.newPassword}
        onBlur={e => {
          if (e.target.value && Validator.password(e.target.value)) {
            setErrors(errors => ({...errors, newPassword: Validator.password(e.target.value)}));
          } else {
            setErrors(errors => ({...errors, newPassword: null}));
          }
        }}
        type={'password'}
      />


      <Typography variant="h5"
                  style={{marginTop: '20px'}}>
        {'Please repeat your new password:'}
      </Typography>

      <GeneralField
        id={'repeatNewPassword'}
        label={'Repeat New Password'}
        required
        onChange={e => form.repeatNewPassword = e.target.value}
        value={form.repeatNewPassword}
        error={!!errors.repeatNewPassword}
        helperText={errors.repeatNewPassword}
        onBlur={e => {
          if (e.target.value && e.target.value !== form.newPassword) {
            setErrors(errors => ({
              ...errors,
              repeatNewPassword: 'Please confirm that this match the new password you entered.'
            }));
          } else {
            setErrors(errors => ({...errors, repeatNewPassword: null}));
          }
        }
        }
        type={'password'}
      />
      {/* new password submit button */}
      <Button
        variant="contained"
        color="primary"
        style={{marginTop: '20px'}}
        className={classes.button}
        onClick={handleSubmit}>
        Submit
      </Button>

      {/* dialog for confirming new password */}
      <AlertDialog dialogContentText={"Note that you won't be able to edit the information after clicking CONFIRM."}
                   dialogTitle={'Are you sure to submit?'}
                   buttons={[<Button onClick={() => setDialogSubmit(false)} key={'cancel'}>{'cancel'}</Button>,
                     <LoadingButton noDefaultStyle variant="text" color="primary"
                                    loading={loadingButton} key={'Confirm New'}
                                    onClick={handleConfirm}>{'confirm'}</LoadingButton>]}
                   open={dialogSubmit}/>

    </Container>);

}