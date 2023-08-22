const express = require('express');
const {createCodeHandler, fetchCodeHandler} = require("../services/code/code");



const router = express.Router({mergeParams: true});

router.post('/', createCodeHandler);
router.get('/:uri/', fetchCodeHandler);
// router.put('/:uri/', null);
// router.delete('/:uri', null);

module.exports = router;