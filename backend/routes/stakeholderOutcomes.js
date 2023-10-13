const express = require("express");
const {fetchStakeholderOutcomesHandler} = require("../services/stakeholderOutcome/stakeholderOutcomes");

const router = express.Router();

router.get('/', fetchStakeholderOutcomesHandler);


module.exports = router;