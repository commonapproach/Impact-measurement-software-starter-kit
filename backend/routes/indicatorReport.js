const express = require('express');
const {createIndicatorReportHandler, fetchIndicatorReportHandler} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

router.get('/:id', fetchIndicatorReportHandler);
router.post('/', createIndicatorReportHandler)
// router.put('/:id', updateIndicatorHandler)


module.exports = router;