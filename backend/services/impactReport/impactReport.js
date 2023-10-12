const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {GDBImpactReportModel} = require("../../models/impactReport");


const RESOURCE = 'ImpactReport';
const fetchImpactReportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE))
      return await fetchImpactReport(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactReportsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchImpactReports(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactReportInterfaceHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchImpactReportInterface(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactReportInterface = async (req, res) => {
  const impactReportInterface = {}
  const impactReports = await GDBImpactReportModel.find({});
  impactReports.map(impactReport => {
    impactReportInterface[impactReport._uri] = impactReport.name
  })
  return res.status(200).json({success: true, impactReportInterface});
};

const fetchImpactReports = async (req, res) => {
  const {orgUri} = req.params;
  if (!orgUri)
    throw new Server400Error('Organization URI is missing');
  const impactReports = await GDBImpactReportModel.find({forOrganization: orgUri}, {populates: ['impactScale.value', 'impactDepth.value', 'forStakeholderOutcome']});
  return res.status(200).json({success: true, impactReports});
};

const fetchImpactReport = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('URI is missing');
  const impactReport = await GDBImpactReportModel.findOne({_uri: uri}, {populates: ['impactScale.value', 'impactDepth.value', 'forStakeholderOutcome']});
  if (!impactReport)
    throw new Server400Error('No such impact Report');
  return res.status(200).json({success: true, impactReport});
};

module.exports = {fetchImpactReportHandler, fetchImpactReportsHandler, fetchImpactReportInterfaceHandler};