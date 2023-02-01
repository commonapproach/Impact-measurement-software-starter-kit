const express = require('express');
const {fetchDomainsHandler} = require("../services/domain/domains");



const router = express.Router();

router.get('/', fetchDomainsHandler);



module.exports = router;