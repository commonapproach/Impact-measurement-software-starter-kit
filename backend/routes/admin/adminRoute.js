const express = require('express');
const {authAdminMiddleware} = require("../../services/middleware");
const {organizationsRoute} = require("./index");

const router = express.Router({mergeParams: true});

router.use('/', authAdminMiddleware('Admin only'));
// router.use('/groups', groupsRoute);
// router.use('/group', groupRoute);
router.use('/organizations', organizationsRoute);

module.exports = router;