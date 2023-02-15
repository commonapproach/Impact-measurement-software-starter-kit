const express = require('express');
const {inviteNewUser} = require("../services/users/invite");
const {superuserFetchUserById, superuserUpdateUserById} = require("../services/user/user");
const {superuserDeleteUser} = require("../services/users/users");
const {regularUserSuperuserGetProfile, regularUserSuperuserUpdateProfile} = require("../services/profile/profile");

const router = express.Router({mergeParams: true});


router.get('/:id', superuserFetchUserById);
router.post('/invite', inviteNewUser);
router.delete('/:id', superuserDeleteUser);
router.post('/updateUser/:id', superuserUpdateUserById)
router.get('/profile/edit/:id', regularUserSuperuserGetProfile)
router.post('/profile/:id', regularUserSuperuserUpdateProfile)

module.exports = router;