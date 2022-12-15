const express = require('express');
const {authGroupAdminMiddlewere} = require("../../services/middleware");
const {groupsRoute} = require("./index");


const router = express.Router({mergeParams: true});

router.use('/', authGroupAdminMiddlewere('Group Admin only'));
router.use('/groups', groupsRoute);

module.exports = router;