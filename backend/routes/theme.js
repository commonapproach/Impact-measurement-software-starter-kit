const express = require('express');
const {fetchThemeHandler, updateThemeHandler, createThemeHandler} = require("../services/theme/theme");

const router = express.Router({mergeParams: true});

router.post('/', createThemeHandler)
router.get('/:id', fetchThemeHandler)
router.put('/:id', updateThemeHandler)
// router.delete('/:id', superuserDeleteOrganization)

module.exports = router;