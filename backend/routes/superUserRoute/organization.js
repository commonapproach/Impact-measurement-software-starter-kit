const express = require('express');
const {superuserCreateOrganization, superuserFetchOrganization} = require("../../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.post('/', superuserCreateOrganization)
router.get('/:id', superuserFetchOrganization)

module.exports = router;