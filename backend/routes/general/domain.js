const express = require('express');
const {fetchDomain} = require("../../services/domain/domain");



const router = express.Router();

router.get('/:id', fetchDomain);



module.exports = router;