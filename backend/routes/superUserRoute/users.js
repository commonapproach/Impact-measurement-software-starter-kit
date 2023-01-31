const express = require('express');
const {superUserFetchUsers} = require("../../services/users/users");
const {inviteNewUser} = require("../../services/users/invite");

const router = express.Router({mergeParams: true});


// router.get('/', superUserFetchUsers);
// router.get('/:userType', superUserFetchUsers)

module.exports = router;
