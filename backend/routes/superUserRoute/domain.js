const express = require("express");
const {createDomain, deleteDomain, updateDomain} = require("../../services/domain/domain");

const router = express.Router({mergeParams: true});

router.post('/', createDomain);
router.delete('/:id', deleteDomain)
// router.get('/:id/', superuserFetchGroup);
router.put('/:id/', updateDomain);

module.exports = router;