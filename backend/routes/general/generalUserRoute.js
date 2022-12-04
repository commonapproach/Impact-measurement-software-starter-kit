const express = require('express');
const {userTypesRoute, profileRoute} = require('./index')
const {authGeneralMiddleware} = require("../../services/middleware");


const router = express.Router({mergeParams: true});

// router.use('/', authGeneralMiddleware('A user can only handle its own affairs'))
router.use('/userTypes', userTypesRoute);
router.use('/profile', profileRoute);

module.exports = router;