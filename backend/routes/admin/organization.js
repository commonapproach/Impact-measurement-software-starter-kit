const express = require('express');
const {adminFetchOrganization, adminUpdateOrganization} = require("../../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.get('/:id', adminFetchOrganization)
router.put('/:id', adminUpdateOrganization)

module.exports = router;