const express = require('express');
const {fetchOutcomesHandler, fetchOutcomesThroughThemeHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/', fetchOutcomesHandler);
router.get('/:organizationUri', fetchOutcomesHandler);
router.get('/theme/:themeUri', fetchOutcomesThroughThemeHandler)



module.exports = router;