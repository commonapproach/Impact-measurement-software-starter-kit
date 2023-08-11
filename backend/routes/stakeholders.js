const express = require('express');
const {fetchStakeholdersHandler} = require("../services/stakeholder/stakeholders");

const router = express.Router({mergeParams: true});

router.get('/', fetchStakeholdersHandler);

module.exports = router;