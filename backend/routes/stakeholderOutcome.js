const express = require('express');

const {fetchStakeholderOutcomesThroughStakeholderHandler, fetchStakeholderOutcomesHandler,
  fetchStakeholderOutcomeInterfacesHandler, fetchStakeholderOutcomesThroughOrganizationHandler
} = require("../services/stakeholderOutcome/stakeholderOutcome");

const router = express.Router();

// router.post('/', createStakeholderHandler);
router.get('/organization/:organizationUri', fetchStakeholderOutcomesThroughOrganizationHandler);
router.get('/stakeholder/:stakeholderUri', fetchStakeholderOutcomesThroughStakeholderHandler);
router.get('/interfaces', fetchStakeholderOutcomeInterfacesHandler)
router.get('/:uri', fetchStakeholderOutcomesHandler);
// router.put('/:uri', updateStakeholderHandler);

module.exports = router;