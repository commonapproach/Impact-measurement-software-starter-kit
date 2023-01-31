const express = require('express');
const {adminFetchUsers} = require("../../services/users/users");

const router = express.Router({mergeParams: true});


// router.get('/', adminFetchUsers);
// router.get('/:userType', adminFetchUsers);

module.exports = router;
