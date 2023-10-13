const express = require('express');

const {fetchStakeholderOutcomesThroughStakeholderHandler, fetchStakeholderOutcomeHandler,
  fetchStakeholderOutcomeInterfacesHandler, fetchStakeholderOutcomesThroughOrganizationHandler
} = require("../services/stakeholderOutcome/stakeholderOutcome");

const router = express.Router();

// router.post('/', createStakeholderHandler);
router.get('/organization/:organizationUri', fetchStakeholderOutcomesThroughOrganizationHandler);
router.get('/stakeholder/:stakeholderUri', fetchStakeholderOutcomesThroughStakeholderHandler);
router.get('/interfaces', fetchStakeholderOutcomeInterfacesHandler)
router.get('/:uri', fetchStakeholderOutcomeHandler);
// router.put('/:uri', updateStakeholderHandler);

module.exports = router;