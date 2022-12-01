const express = require('express');
const {createGroup, superuserFetchGroup, superuserUpdateGroup} = require("../../services/groups/group");


const router = express.Router({mergeParams: true});

router.post('/', createGroup);
router.get('/:id/', superuserFetchGroup)
router.put('/:id/', superuserUpdateGroup)

module.exports = router;