const express = require('express');
const {regularUserUpdatePassword, regularUserSuperuserGetProfile,
  regularUserUpdateSecurityQuestions, regularUserSuperuserUpdateProfile
} = require("../../services/profile/profile");
const {authGeneralMiddleware} = require("../../services/middleware");


const router = express.Router();

router.use('/:id', authGeneralMiddleware('A user can only handle its own affairs'))
router.get('/:id/', regularUserSuperuserGetProfile);
router.post('/:id/resetPassword/', regularUserUpdatePassword);
router.post('/:id/securityQuestions/', regularUserUpdateSecurityQuestions)
router.post('/:id/', regularUserSuperuserUpdateProfile);



module.exports = router;