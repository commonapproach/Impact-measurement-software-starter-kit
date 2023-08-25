const express = require('express');
const {createCharacteristicHandler} = require("../services/characteristic/characteristic");




const router = express.Router({mergeParams: true});

router.post('/', createCharacteristicHandler);
// router.get('/:uri/', fetchCodeHandler);
// router.put('/:uri/', updateCodeHandler);
// router.delete('/:uri', null);

module.exports = router;