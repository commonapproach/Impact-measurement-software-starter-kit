const express = require('express');
const {fetchThemeHandler, updateThemeHandler, createThemeHandler} = require("../services/theme/theme");

const router = express.Router({mergeParams: true});

router.post('/', createThemeHandler)
router.get('/:uri', fetchThemeHandler)
router.put('/:uri', updateThemeHandler)
// router.delete('/:id', superuserDeleteOrganization)

module.exports = router;