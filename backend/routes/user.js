const express = require('express');
const {inviteNewUserHandler} = require("../services/users/invite");
const {fetchUserHandler, updateUserHandler} = require("../services/user/user");
const {fetchProfileHandler, updateProfileHandler} = require("../services/profile/profile");

const router = express.Router({mergeParams: true});


router.get('/:id', fetchUserHandler);
router.post('/invite', inviteNewUserHandler);
router.post('/updateUser/:id', updateUserHandler)
router.get('/profile/:id', fetchProfileHandler)
router.post('/profile/:id', updateProfileHandler)

module.exports = router;