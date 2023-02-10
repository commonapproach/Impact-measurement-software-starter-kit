const express = require('express');
const {createIndicatorReportHandler, fetchIndicatorReportHandler, updateIndicatorReportHandler,
  fetchIndicatorReportsHandler
} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

router.get('/:id', fetchIndicatorReportHandler);
router.post('/', createIndicatorReportHandler);
router.put('/:id', updateIndicatorReportHandler);
router.get('/:orgId', fetchIndicatorReportsHandler)


module.exports = router;