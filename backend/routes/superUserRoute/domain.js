const express = require("express");
const {createDomain, deleteDomain} = require("../../services/domain/domain");

const router = express.Router({mergeParams: true});

router.post('/', createDomain);
router.delete('/:id', deleteDomain)
// router.get('/:id/', superuserFetchGroup);
// router.put('/:id/', superuserUpdateGroup);

module.exports = router;