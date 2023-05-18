const express = require('express');
const {
  superuserDeleteGroup, createGroupHandler, fetchGroupHandler, updateGroupHandler
} = require("../services/groups/group");


const router = express.Router({mergeParams: true});

router.post('/', createGroupHandler);
router.get('/:uri/', fetchGroupHandler);
router.put('/:uri/', updateGroupHandler);
router.delete('/:uri', superuserDeleteGroup);

module.exports = router;