const express = require('express');
const {fetchCodesHandler} = require("../services/code/codes");



const router = express.Router({mergeParams: true});

router.get('/', fetchCodesHandler)

module.exports = router;