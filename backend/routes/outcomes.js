const express = require('express');
const {fetchOutcomesHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/:organizationId', fetchOutcomesHandler);



module.exports = router;