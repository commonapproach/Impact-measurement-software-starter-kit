const express = require('express');
const {
  fetchIndicatorReportsHandler
} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

router.get('/:orgId', fetchIndicatorReportsHandler);


module.exports = router;