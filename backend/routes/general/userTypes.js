const express = require('express');
const {fetchUserTypes} = require("../../services/userTypes");


const router = express.Router();


router.get('/fetchUserTypes', fetchUserTypes);


module.exports = router;