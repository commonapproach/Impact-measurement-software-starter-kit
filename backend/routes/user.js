const express = require('express');
const {inviteNewUserHandler} = require("../services/users/invite");
const {superuserFetchUserById, superuserUpdateUserById} = require("../services/user/user");
const {superuserDeleteUser} = require("../services/users/users");
const {regularUserSuperuserUpdateProfile, fetchProfileHandler, updateProfileHandler} = require("../services/profile/profile");

const router = express.Router({mergeParams: true});


router.get('/:id', superuserFetchUserById);
router.post('/invite', inviteNewUserHandler);
router.delete('/:id', superuserDeleteUser);
router.post('/updateUser/:id', superuserUpdateUserById)
router.get('/profile/:id', fetchProfileHandler)
router.post('/profile/:id', updateProfileHandler)

module.exports = router;