const express = require('express');
const {fetchIndicatorsHandler} = require("../services/indicators/indicator");



const router = express.Router();

router.get('/', fetchIndicatorsHandler);
router.get('/:organizationUri', fetchIndicatorsHandler);



module.exports = router;