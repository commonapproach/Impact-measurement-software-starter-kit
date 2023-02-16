const express = require('express');
const {
  superuserFetchGroup,
  superuserUpdateGroup,
  superuserDeleteGroup, createGroupHandler
} = require("../services/groups/group");


const router = express.Router({mergeParams: true});

router.post('/', createGroupHandler);
router.get('/:id/', superuserFetchGroup);
router.put('/:id/', superuserUpdateGroup);
router.delete('/:id', superuserDeleteGroup);

module.exports = router;