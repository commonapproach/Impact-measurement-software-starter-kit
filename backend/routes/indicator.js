const express = require('express');
const {fetchIndicatorHandler, createIndicatorHandler} = require("../services/indicators/indicator");



const router = express.Router();

router.get('/:id', fetchIndicatorHandler);
router.post('/', createIndicatorHandler)



module.exports = router;