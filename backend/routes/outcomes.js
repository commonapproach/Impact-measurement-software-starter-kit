const express = require('express');
const {fetchOutcomesHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/', fetchOutcomesHandler);
router.get('/:organizationUri', fetchOutcomesHandler);



module.exports = router;