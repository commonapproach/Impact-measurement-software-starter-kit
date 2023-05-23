const express = require('express');
const {createIndicatorReportHandler, fetchIndicatorReportHandler, updateIndicatorReportHandler,
  fetchIndicatorReportsHandler
} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

router.get('/:uri', fetchIndicatorReportHandler);
router.post('/', createIndicatorReportHandler);
router.put('/:uri', updateIndicatorReportHandler);
router.get('/:orgUri', fetchIndicatorReportsHandler)


module.exports = router;