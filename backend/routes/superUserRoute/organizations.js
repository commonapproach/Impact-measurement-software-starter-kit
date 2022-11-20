const express = require('express');
const {fetchOrganizations} = require("../../services/organizations/organizations");

const router = express.Router({mergeParams: true});

router.get('/', fetchOrganizations)

module.exports = router;