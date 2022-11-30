const express = require('express');
const {createGroup} = require("../../services/groups/group");


const router = express.Router({mergeParams: true});

router.post('/', createGroup);

module.exports = router;