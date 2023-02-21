const express = require('express');
const {fetchOutcomesHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/', fetchOutcomesHandler);
router.get('/:organizationId', fetchOutcomesHandler);



module.exports = router;