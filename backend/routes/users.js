const express = require('express');

const {superUserFetchUsers} = require('../services/users/users');


const router = express.Router({mergeParams: true});


router.get('/', superUserFetchUsers);

module.exports = router;