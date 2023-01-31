const express = require('express');
const {groupAdminFetchOrganizations} = require("../../services/organizations/organizations");


const router = express.Router({mergeParams: true});

// router.get('/', groupAdminFetchOrganizations)

module.exports = router;