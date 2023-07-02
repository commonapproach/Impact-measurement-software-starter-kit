const express = require('express');
const {fetchOrganizationsHandler, fetchOrganizationsInterfacesHandler} = require("../services/organizations/organizations");

const router = express.Router({mergeParams: true});

router.get('/orgAdmin/:orgAdminUri', fetchOrganizationsHandler)
router.get('/interface', fetchOrganizationsInterfacesHandler);
router.get('/:groupUri', fetchOrganizationsHandler);
router.get('/', fetchOrganizationsHandler);

module.exports = router;