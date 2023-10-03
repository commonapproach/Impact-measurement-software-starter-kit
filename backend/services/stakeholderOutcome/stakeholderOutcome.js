const {Server400Error} = require("../../utils");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {hasAccess} = require("../../helpers/hasAccess");



const fetchStakeholderOutcomesThroughStakeholderHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderOutcomes'))
      return await fetchStakeholderOutcomesThroughStakeholder(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchStakeholderOutcomesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderOutcomes'))
      return await fetchStakeholderOutcomes(req, res);
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

const fetchStakeholderOutcomes = async (req, res) => {
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


module.exports = {
  fetchStakeholderOutcomesThroughStakeholderHandler, fetchStakeholderOutcomesHandler, fetchStakeholderOutcomeInterfacesHandler
}