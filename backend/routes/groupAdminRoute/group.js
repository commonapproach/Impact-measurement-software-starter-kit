const express = require('express');
const {groupAdminFetchGroup} = require("../../services/groups/group");


const router = express.Router({mergeParams: true});

router.get('/:id/', groupAdminFetchGroup);

module.exports = router;