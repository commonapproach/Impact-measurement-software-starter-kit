const express = require('express');
const {adminFetchOrganizations} = require("../../services/organizations/organizations");


const router = express.Router({mergeParams: true});

router.get('/', adminFetchOrganizations)

module.exports = router;