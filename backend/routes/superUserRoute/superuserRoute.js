const express = require('express');
const {authSuperuserMiddleware} = require("../../services/middleware");
const {usersRoute, userRoute, organizationsRoute} = require('./index')


const router = express.Router({mergeParams: true});

router.use('/', authSuperuserMiddleware('superuser only'));
router.use('/users', usersRoute);
router.use('/user', userRoute);
router.use('/organizations', organizationsRoute)

module.exports = router;