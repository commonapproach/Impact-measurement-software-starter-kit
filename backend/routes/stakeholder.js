const express = require('express');

const {createStakeholderHandler, fetchStakeholderHandler, updateStakeholderHandler, fetchStakeholderInterfaceHandler} = require("../services/stakeholder/stakeholder");

const router = express.Router();

router.post('/', createStakeholderHandler);
router.get('/interface', fetchStakeholderInterfaceHandler);
router.get('/:uri', fetchStakeholderHandler);
router.put('/:uri', updateStakeholderHandler);

module.exports = router;