const express = require('express');
const {fetchUsersHandler} = require("../services/users/users");

const router = express.Router({mergeParams: true});


router.get('/', fetchUsersHandler);
router.get('/:orgId', fetchUsersHandler);

module.exports = router;