const express = require('express');
const {createOutcomeHandler} = require("../services/outcomes/outcome");



const router = express.Router();

// router.get('/:id', fetchIndicatorHandler);
router.post('/', createOutcomeHandler);
// router.put('/:id', updateIndicatorHandler)


module.exports = router;