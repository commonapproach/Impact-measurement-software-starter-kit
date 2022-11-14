const express = require('express');
const {superUserFetchUsers} = require("../../services/users/users");
const {inviteNewUser} = require("../../services/users/invite");

const router = express.Router({mergeParams: true});


router.get('/', superUserFetchUsers);
router.post('/invite', inviteNewUser);

module.exports = router;
