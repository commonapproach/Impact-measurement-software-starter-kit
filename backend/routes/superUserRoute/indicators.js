const express = require('express');
const {fetchIndicators} = require("../../services/indicators/indicator");

const router = express.Router({mergeParams: true});

// router.get('/:organizationId', fetchIndicators)

module.exports = router;