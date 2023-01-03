const express = require('express');
const {fetchDomains} = require("../../services/domain/domains");



const router = express.Router();

router.get('/', fetchDomains);



module.exports = router;