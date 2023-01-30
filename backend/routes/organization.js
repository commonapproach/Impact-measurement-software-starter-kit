const express = require('express');
const { createOrganization,
  superuserDeleteOrganization, fetchOrganization, updateOrganization
} = require("../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.post('/', fetchOrganization)
router.get('/:id', createOrganization)
router.put('/:id', updateOrganization)
router.delete('/:id', superuserDeleteOrganization)

module.exports = router;