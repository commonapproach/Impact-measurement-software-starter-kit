const express = require('express');
const {
  fetchOrganizationHandler, createOrganizationHandler,
  updateOrganizationHandler
} = require("../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.post('/', createOrganizationHandler)
router.get('/:uri', fetchOrganizationHandler)
router.put('/:uri', updateOrganizationHandler)
// router.delete('/:id', superuserDeleteOrganization)

module.exports = router;