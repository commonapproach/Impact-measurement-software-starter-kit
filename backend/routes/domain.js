const express = require('express');
const {fetchDomainHandler, updateDomainHandler, createDomainHandler} = require("../services/domain/domain");

const router = express.Router({mergeParams: true});

router.post('/', createDomainHandler)
router.get('/:id', fetchDomainHandler)
router.put('/:id', updateDomainHandler)
// router.delete('/:id', superuserDeleteOrganization)

module.exports = router;