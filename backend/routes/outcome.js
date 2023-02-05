const express = require('express');
const {createOutcomeHandler, fetchOutcomeHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/:id', fetchOutcomeHandler);
router.post('/', createOutcomeHandler);
// router.put('/:id', updateIndicatorHandler)


module.exports = router;