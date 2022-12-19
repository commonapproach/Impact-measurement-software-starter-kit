const express = require('express');
const {login, logout, getUserSecurityQuestions, checkUserSecurityQuestion, getSecurityQuestionsByEmail} = require('../../services/userAccount/auth');
const {verifyUser, firstEntryRegister} = require("../../services/userAccount/firstEntry");


const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Hello from Express!!');
});

router.post('/verify/firstEntry', verifyUser);
router.put('/register/firstEntry', firstEntryRegister);
router.get('/forgotPassword/securityQuestions/fetch/:email', getSecurityQuestionsByEmail)
router.post('/login', login);
router.get('/login/securityQuestions/fetch', getUserSecurityQuestions)
router.post('/login/securityQuestions/check', checkUserSecurityQuestion)
router.post('/logout', logout);

module.exports = router;
