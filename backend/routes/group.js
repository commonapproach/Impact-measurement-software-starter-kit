const express = require('express');
const {
  superuserDeleteGroup, createGroupHandler, fetchGroupHandler, updateGroupHandler
} = require("../services/groups/group");


const router = express.Router({mergeParams: true});

router.post('/', createGroupHandler);
router.get('/:id/', fetchGroupHandler);
router.put('/:id/', updateGroupHandler);
router.delete('/:id', superuserDeleteGroup);

module.exports = router;