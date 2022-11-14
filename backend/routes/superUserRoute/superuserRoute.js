const express = require('express');
const {authSuperuserMiddleware} = require("../../services/middleware");
const {usersRoute} = require('./index')


const router = express.Router({mergeParams: true});

router.use('/', authSuperuserMiddleware('superuser only'));
router.use('/users', usersRoute);

module.exports = router;