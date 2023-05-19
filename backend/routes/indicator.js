const express = require('express');
const {fetchIndicatorHandler, createIndicatorHandler, updateIndicatorHandler} = require("../services/indicators/indicator");



const router = express.Router();

router.get('/:uri', fetchIndicatorHandler);
router.post('/', createIndicatorHandler)
router.put('/:uri', updateIndicatorHandler)


module.exports = router;