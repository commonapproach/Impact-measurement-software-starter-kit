const express = require('express');
const {authSuperuserMiddleware} = require("../../services/middleware");
const {usersRoute, userRoute, organizationsRoute, organizationRoute, groupsRoute, groupRoute, domainRoute} = require('./index')


const router = express.Router({mergeParams: true});

router.use('/', authSuperuserMiddleware('Superuser only'));
router.use('/users', usersRoute);
router.use('/user', userRoute);
router.use('/organizations', organizationsRoute);
router.use('/organization', organizationRoute);
router.use('/groups', groupsRoute);
router.use('/group', groupRoute);
router.use('/domain', domainRoute)

module.exports = router;