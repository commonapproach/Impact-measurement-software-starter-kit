const express = require('express');

const {createStakeholderHandler, fetchStakeholderHandler} = require("../services/stakeholder/stakeholder");

const router = express.Router({mergeParams: true});

router.post('/', createStakeholderHandler);
router.get('/:uri', fetchStakeholderHandler);

module.exports = router;