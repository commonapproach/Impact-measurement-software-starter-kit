const express = require('express');
const {authSuperuserMiddleware} = require("../../services/middleware");
const {usersRoute, userRoute, organizationsRoute, organizationRoute} = require('./index')


const router = express.Router({mergeParams: true});

router.use('/', authSuperuserMiddleware('superuser only'));
router.use('/users', usersRoute);
router.use('/user', userRoute);
router.use('/organizations', organizationsRoute);
router.use('/organization', organizationRoute);

module.exports = router;