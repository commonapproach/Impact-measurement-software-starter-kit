const express = require('express');
const {fetchIndicatorsHandler} = require("../services/indicators/indicator");



const router = express.Router();

router.get('/:organizationId', fetchIndicatorsHandler);



module.exports = router;