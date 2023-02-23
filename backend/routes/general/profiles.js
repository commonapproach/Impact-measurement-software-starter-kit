const express = require('express');
const {regularUserUpdatePassword,
  regularUserUpdateSecurityQuestions, regularUserSuperuserUpdateProfile, fetchProfileHandler, updateProfileHandler
} = require("../../services/profile/profile");
const {authGeneralMiddleware} = require("../../services/middleware");


const router = express.Router();

router.get('/:id/', fetchProfileHandler);
router.post('/:id/resetPassword/', regularUserUpdatePassword);
router.post('/:id/securityQuestions/', regularUserUpdateSecurityQuestions)
router.post('/:id/', updateProfileHandler);



module.exports = router;