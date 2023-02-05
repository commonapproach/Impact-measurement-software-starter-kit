const express = require('express');
const {createOutcomeHandler, fetchOutcomeHandler, updateOutcomeHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/:id', fetchOutcomeHandler);
router.post('/', createOutcomeHandler);
router.put('/:id', updateOutcomeHandler);


module.exports = router;