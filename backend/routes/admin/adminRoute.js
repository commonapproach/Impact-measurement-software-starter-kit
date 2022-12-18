const express = require('express');
const {authAdminMiddleware} = require("../../services/middleware");
const {organizationsRoute, usersRoute, organizationRoute} = require("./index");

const router = express.Router({mergeParams: true});

router.use('/', authAdminMiddleware('Admin only'));
// router.use('/groups', groupsRoute);
// router.use('/group', groupRoute);
router.use('/organizations', organizationsRoute);
router.use('/organization', organizationRoute);
router.use('/users', usersRoute);

module.exports = router;