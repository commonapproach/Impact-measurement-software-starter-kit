const express = require('express');
const {getIndividualsInClass} = require("../../services/dynamicClassInstances");


const router = express.Router();

router.get('/:class', getIndividualsInClass);


module.exports = router;