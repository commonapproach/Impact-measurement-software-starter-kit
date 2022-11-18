const express = require('express');
const {authSuperuserMiddleware} = require("../../services/middleware");
const {usersRoute, userRoute} = require('./index')


const router = express.Router({mergeParams: true});

router.use('/', authSuperuserMiddleware('superuser only'));
router.use('/users', usersRoute);
router.use('/user', userRoute);

module.exports = router;