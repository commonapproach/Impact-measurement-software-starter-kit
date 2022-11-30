const express = require('express');
const {superuserFetchGroups} = require("../../services/groups/groups");


const router = express.Router({mergeParams: true});

router.get('/', superuserFetchGroups)

module.exports = router;