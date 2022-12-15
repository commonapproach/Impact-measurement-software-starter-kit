const express = require('express');
const {groupAdminFetchGroups} = require("../../services/groups/groups");


const router = express.Router({mergeParams: true});

router.get('/', groupAdminFetchGroups)

module.exports = router;