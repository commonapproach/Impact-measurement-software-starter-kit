const express = require('express');
const {fetchThemesHandler} = require("../services/theme/themes");



const router = express.Router();

router.get('/', fetchThemesHandler);



module.exports = router;