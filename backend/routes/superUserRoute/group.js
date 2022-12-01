const express = require('express');
const {
  createGroup,
  superuserFetchGroup,
  superuserUpdateGroup,
  superuserDeleteGroup
} = require("../../services/groups/group");


const router = express.Router({mergeParams: true});

router.post('/', createGroup);
router.get('/:id/', superuserFetchGroup);
router.put('/:id/', superuserUpdateGroup);
router.delete('/:id', superuserDeleteGroup);

module.exports = router;