const express = require('express');
const {fetchCharacteristicsHandler} = require("../services/characteristic/characteristics");

const router = express.Router({mergeParams: true});

router.get('/', fetchCharacteristicsHandler)

module.exports = router;