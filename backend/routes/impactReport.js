const express = require('express');
const {fetchImpactReportHandler} = require("../services/impactReport/impactReport");


const router = express.Router();

router.get('/:uri', fetchImpactReportHandler);
// router.post('/', createIndicatorReportHandler);
// router.put('/:uri', updateIndicatorReportHandler);


module.exports = router;