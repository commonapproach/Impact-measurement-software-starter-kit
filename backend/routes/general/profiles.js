const express = require('express');
const {regularUserGetProfile} = require("../../services/profile/profile");
const {authGeneralMiddleware} = require("../../services/middleware");


const router = express.Router();

router.use('/:id', authGeneralMiddleware('A user can only handle its own affairs'))
router.get('/:id/', regularUserGetProfile);


module.exports = router;