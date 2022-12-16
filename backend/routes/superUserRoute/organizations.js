const express = require('express');
const {superuserFetchOrganizations} = require("../../services/organizations/organizations");

const router = express.Router({mergeParams: true});

router.get('/', superuserFetchOrganizations)

module.exports = router;