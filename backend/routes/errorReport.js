const express = require('express');
const {frontendErrorReportHandler} = require("../services/errorReport/frontendErrorReport");



const router = express.Router({mergeParams: true});

router.post('/', frontendErrorReportHandler);

module.exports = router;