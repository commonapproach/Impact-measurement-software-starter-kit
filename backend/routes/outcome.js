const express = require('express');
const {createOutcomeHandler, fetchOutcomeHandler, updateOutcomeHandler, fetchOutcomeInterfaceHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/interface/:organizationUri', fetchOutcomeInterfaceHandler);
// router.get('/interface', fetchOutcomeInterfaceHandler);
router.get('/:uri', fetchOutcomeHandler);
router.post('/', createOutcomeHandler);
router.put('/:uri', updateOutcomeHandler);


module.exports = router;