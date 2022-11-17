const express = require('express');
const {superUserFetchUsers, superuserDeleteUser} = require("../../services/users/users");
const {inviteNewUser} = require("../../services/users/invite");

const router = express.Router({mergeParams: true});


router.get('/', superUserFetchUsers);
router.post('/invite', inviteNewUser);
router.delete('/:id', superuserDeleteUser);

module.exports = router;
