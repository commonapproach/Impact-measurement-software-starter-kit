const express = require('express');
const {
  fetchIndicatorReportsHandler
} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

router.get('/:orgUri', fetchIndicatorReportsHandler);


module.exports = router;