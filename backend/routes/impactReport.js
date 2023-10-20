const express = require('express');
const {fetchImpactReportHandler, createImpactReportHandler} = require("../services/impactReport/impactReport");


const router = express.Router();

router.get('/:uri', fetchImpactReportHandler);
router.post('/', createImpactReportHandler);
// router.put('/:uri', updateIndicatorReportHandler);


module.exports = router;