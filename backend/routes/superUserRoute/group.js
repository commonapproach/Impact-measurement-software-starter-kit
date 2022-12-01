const express = require('express');
const {createGroup, superuserFetchGroup} = require("../../services/groups/group");


const router = express.Router({mergeParams: true});

router.post('/', createGroup);
router.get('/:id/', superuserFetchGroup)

module.exports = router;