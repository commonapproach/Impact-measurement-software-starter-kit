const express = require('express');
const {fetchCodesHandler, fetchCodesInterfaceHandler} = require("../services/code/codes");



const router = express.Router({mergeParams: true});

router.get('/', fetchCodesHandler)
router.get('/interface', fetchCodesInterfaceHandler)

module.exports = router;