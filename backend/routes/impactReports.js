const express = require("express");
const {fetchImpactReportsHandler, fetchImpactReportInterfaceHandler} = require("../services/impactReport/impactReport");


const router = express.Router();
router.get('/interface', fetchImpactReportInterfaceHandler)
router.get('/:orgUri', fetchImpactReportsHandler)
module.exports = router;