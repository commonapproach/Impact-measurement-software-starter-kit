const express = require('express');
const {superuserCreateOrganization, superuserFetchOrganization, superuserUpdateOrganization,
  superuserDeleteOrganization
} = require("../../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.post('/', superuserCreateOrganization)
router.get('/:id', superuserFetchOrganization)
router.put('/:id', superuserUpdateOrganization)
router.delete('/:id', superuserDeleteOrganization)

module.exports = router;