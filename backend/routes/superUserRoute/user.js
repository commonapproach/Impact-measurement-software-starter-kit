const express = require('express');
const {inviteNewUser} = require("../../services/users/invite");
const {superuserFetchUserById, superuserUpdateUserById} = require("../../services/user/user");
const {superuserDeleteUser} = require("../../services/users/users");

const router = express.Router({mergeParams: true});


router.get('/:id', superuserFetchUserById);
router.post('/invite', inviteNewUser);
router.delete('/:id', superuserDeleteUser);
router.post('/updateUser/:id', superuserUpdateUserById)

module.exports = router;