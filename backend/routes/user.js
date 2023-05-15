const express = require('express');
const {inviteNewUserHandler} = require("../services/users/invite");
const {fetchUserHandler, updateUserHandler} = require("../services/user/user");
const {fetchProfileHandler, updateProfileHandler} = require("../services/profile/profile");

const router = express.Router({mergeParams: true});


router.get('/:uri', fetchUserHandler);
router.post('/invite', inviteNewUserHandler);
router.post('/updateUser/:uri', updateUserHandler)
router.get('/profile/:uri', fetchProfileHandler)
router.post('/profile/:uri', updateProfileHandler)

module.exports = router;