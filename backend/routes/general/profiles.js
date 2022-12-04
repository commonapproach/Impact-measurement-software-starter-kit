const express = require('express');
const {regularUserGetProfile} = require("../../services/profile/profile");


const router = express.Router();

router.get('/:id/', regularUserGetProfile);


module.exports = router;