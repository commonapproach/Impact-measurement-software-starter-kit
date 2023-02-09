const express = require('express');
const {createIndicatorReportHandler} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

// router.get('/:id', fetchIndicatorHandler);
router.post('/', createIndicatorReportHandler)
// router.put('/:id', updateIndicatorHandler)


module.exports = router;