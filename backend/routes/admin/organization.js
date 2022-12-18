const express = require('express');
const {adminFetchOrganization} = require("../../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.get('/:id', adminFetchOrganization)
// router.put('/:id',)

module.exports = router;