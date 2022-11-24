const express = require('express');
const {createOrganization} = require("../../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.post('/', createOrganization)

module.exports = router;