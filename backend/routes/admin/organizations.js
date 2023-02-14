const express = require('express');
const {fetchOrganizationsHandler} = require("../../services/organizations/organizations");


const router = express.Router({mergeParams: true});

router.get('/', fetchOrganizationsHandler)

module.exports = router;