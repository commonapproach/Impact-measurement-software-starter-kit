const express = require('express');
const {fetchGroupsHandler} = require("../services/groups/groups");


const router = express.Router({mergeParams: true});

router.get('/', fetchGroupsHandler)

module.exports = router;