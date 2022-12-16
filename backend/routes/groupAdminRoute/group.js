const express = require('express');
const {groupAdminFetchGroup, groupAdminUpdateGroup} = require("../../services/groups/group");


const router = express.Router({mergeParams: true});

router.get('/:id/', groupAdminFetchGroup);
router.put('/:id/', groupAdminUpdateGroup);

module.exports = router;