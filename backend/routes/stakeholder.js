const express = require('express');

const {createStakeholderHandler, fetchStakeholderHandler, updateStakeholderHandler} = require("../services/stakeholder/stakeholder");

const router = express.Router();

router.post('/', createStakeholderHandler);
router.get('/:uri', fetchStakeholderHandler);
router.put('/:uri', updateStakeholderHandler);

module.exports = router;