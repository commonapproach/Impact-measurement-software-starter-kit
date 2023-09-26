const express = require('express');
const {createCharacteristicHandler, fetchCharacteristicHandler} = require("../services/characteristic/characteristic");
const {fetchCharacteristicsHandler} = require("../services/characteristic/characteristics");




const router = express.Router({mergeParams: true});

router.post('/', createCharacteristicHandler);
router.get('/:uri/', fetchCharacteristicHandler);
// router.put('/:uri/', updateCodeHandler);
// router.delete('/:uri', null);

module.exports = router;