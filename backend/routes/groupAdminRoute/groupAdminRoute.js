const express = require('express');
const {authGroupAdminMiddleware} = require("../../services/middleware");
const {groupsRoute, organizationsRoute, groupRoute} = require("./index");


const router = express.Router({mergeParams: true});

router.use('/', authGroupAdminMiddleware('Group Admin only'));
router.use('/groups', groupsRoute);
router.use('/group', groupRoute);
router.use('/organizations', organizationsRoute);

module.exports = router;