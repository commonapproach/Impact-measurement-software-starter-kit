const express = require("express");
const {createDomain} = require("../../services/domain/domain");

const router = express.Router({mergeParams: true});

router.post('/', createDomain);
// router.get('/:id/', superuserFetchGroup);
// router.put('/:id/', superuserUpdateGroup);
// router.delete('/:id', superuserDeleteGroup);

module.exports = router;