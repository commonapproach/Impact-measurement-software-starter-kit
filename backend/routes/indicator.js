const express = require('express');
const {fetchIndicatorHandler, createIndicatorHandler, updateIndicatorHandler} = require("../services/indicators/indicator");



const router = express.Router();

router.get('/:id', fetchIndicatorHandler);
router.post('/', createIndicatorHandler)
router.put('/:id', updateIndicatorHandler)


module.exports = router;