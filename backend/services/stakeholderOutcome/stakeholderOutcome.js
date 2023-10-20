const {Server400Error} = require("../../utils");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {GDBStakeholderModel} = require("../../models/stakeholder");
const {Transaction} = require("graphdb-utils");
const {stakeholderOutcomeBuilder} = require("./stakeholderOutcomeBuilder");

const DATATYPE = 'StakeholderOutcome'

const createStakeholderOutcomeHandler = async (req, res, next) => {
  try {
    await Transaction.beginTransaction();
    const {form} = req.body;
    if (await hasAccess(req, 'create' + DATATYPE)) {
      if (await stakeholderOutcomeBuilder('interface', null, null, null, null, null, {}, {}, form)) {
        return res.status(200).json({success: true});
      }
    }
  } catch (e) {
    Transaction.rollback();
    next(e)
  }
}


const fetchStakeholderOutcomesThroughOrganizationHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderOutcomes'))
      return await fetchStakeholderOutcomesThroughOrganization(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchStakeholderOutcomesThroughOrganization = async (req, res) => {
  const {organizationUri} = req.params;
  if (!organizationUri)
    throw new Server400Error('Organization URI is missing')

  const impactNorms = await GDBImpactNormsModel.findOne({organization: organizationUri}, {populates: ['stakeholderOutcomes.outcome', 'stakeholderOutcomes.codes', 'stakeholderOutcomes.impactReports']});
  if (!impactNorms)
    return res.status(200).json({success: true, stakeholderOutcomes: []})
  const stakeholderOutcomes = impactNorms.stakeholderOutcomes
  return res.status(200).json({success: true, stakeholderOutcomes})
}


const fetchStakeholderOutcomesThroughStakeholderHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderOutcomes'))
      return await fetchStakeholderOutcomesThroughStakeholder(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchStakeholderOutcomeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderOutcomes'))
      return await fetchStakeholderOutcome(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchStakeholderOutcomeInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderOutcomes'))
      return await fetchStakeholderOutcomeInterfaces(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchStakeholderOutcomeInterfaces = async (req, res) => {
  const stakeholderOutcomes = await GDBStakeholderOutcomeModel.find({})
  const stakeholderOutcomeInterface = {}
  stakeholderOutcomes.map(
    stakeholderOutcome => {
      stakeholderOutcomeInterface[stakeholderOutcome._uri] = stakeholderOutcome.name
    }
  )
  return res.status(200).json({success: true, stakeholderOutcomeInterface});
}

const fetchStakeholderOutcome = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('URI is missing')
  const stakeholderOutcome = await GDBStakeholderOutcomeModel.findOne({_uri: uri}, )
  return res.status(200).json({success: true, stakeholderOutcome})
}


const fetchStakeholderOutcomesThroughStakeholder = async (req, res) => {
  const {stakeholderUri} = req.params;
  if (!stakeholderUri)
    throw new Server400Error('Stakeholder URI is missing')

  const stakeholderOutcomes = await GDBStakeholderOutcomeModel.find({stakeholder: stakeholderUri}, {populates: ['outcome', 'codes', 'impactReports']});
  return res.status(200).json({success: true, stakeholderOutcomes})
}


module.exports = {createStakeholderOutcomeHandler,
  fetchStakeholderOutcomesThroughStakeholderHandler, fetchStakeholderOutcomeHandler, fetchStakeholderOutcomeInterfacesHandler, fetchStakeholderOutcomesThroughOrganizationHandler
}