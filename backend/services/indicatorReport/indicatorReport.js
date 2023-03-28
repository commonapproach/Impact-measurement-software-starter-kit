const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBDateTimeIntervalModel} = require("../../models/time");
const {GDBMeasureModel} = require("../../models/measure");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBOwnershipModel} = require("../../models/ownership");

const RESOURCE = 'IndicatorReport';

const createIndicatorReportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'create' + RESOURCE))
      return await createIndicatorReport(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const createIndicatorReport = async (req, res) => {
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  if (!userAccount)
    throw new Server400Error('Wrong auth');
  const {form} = req.body;
  if (form?.indicatorName) { // handle the case when no such indicator name
    const indicator = await GDBIndicatorModel.findOne({name: form.indicatorName});
    if (!indicator)
      return res.status(200).json({success: false, message: 'Wrong indicatorName'})
    form.indicator = indicator._id;
  }
  if (!form || !form.name || !form.organization || !form.indicator
    || !form.numericalValue || !form.startTime || !form.endTime || !form.dateCreated)
    throw new Server400Error('Wrong input');

  const organization = await GDBOrganizationModel.findOne({_id: form.organization});
  if (!organization)
    throw new Server400Error('No such organization');
  const indicator = await GDBIndicatorModel.findOne({_id: form.indicator}, {populates: ['unitOfMeasure']});
  if (!indicator)
    throw new Server400Error('No such indicator');
  if (await GDBIndicatorReportModel.findOne({
    forOrganization: ':organization_' + form.organization,
    name: form.name
  })) {
    return res.status(200).json({success: false, message: `${form.name}: The Indicator Report name is occupied`});
  }
  if (form.startTime > form.endTime)
    throw new Server400Error('Start time must be earlier than end time');

  const indicatorReport = GDBIndicatorReportModel({
    name: form.name,
    comment: form.comment,
    forOrganization: organization,
    forIndicator: indicator,
    hasTime: GDBDateTimeIntervalModel({
      hasBeginning: {date: new Date(form.startTime)},
      hasEnd: {date: new Date(form.endTime)}
    }),
    dateCreated: new Date(form.dateCreated),
    value: GDBMeasureModel({numericalValue: form.numericalValue, unitOfMeasure: indicator.unitOfMeasure}),
  });


  await indicatorReport.save();
  const ownership = GDBOwnershipModel({
    resource: indicatorReport,
    owner: userAccount,
    dateOfCreated: new Date(),
  });
  await ownership.save();
  return res.status(200).json({success: true});

};

const fetchIndicatorReportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE))
      return await fetchIndicatorReport(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchIndicatorReport = async (req, res) => {
  const {id} = req.params;
  if (!id)
    throw new Server400Error('Wrong input');
  const indicatorReport = await GDBIndicatorReportModel.findOne({_id: id},
    {populates: ['hasTime.hasBeginning', 'hasTime.hasEnd', 'value.unitOfMeasure']});
  if (!indicatorReport)
    throw new Server400Error('No such indicator Report');
  const form = {
    name: indicatorReport.name,
    comment: indicatorReport.comment,
    organization: indicatorReport.forOrganization.split('_')[1],
    indicator: indicatorReport.forIndicator.split('_')[1],
    numericalValue: indicatorReport.value.numericalValue,
    unitOfMeasure: indicatorReport.value.unitOfMeasure.label,
    startTime: indicatorReport.hasTime.hasBeginning.date,
    endTime: indicatorReport.hasTime.hasEnd.date,
    dateCreated: indicatorReport.dateCreated
  };
  return res.status(200).json({indicatorReport: form, success: true});
};

const updateIndicatorReportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'update' + RESOURCE))
      return await updateIndicatorReport(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const updateIndicatorReport = async (req, res) => {
  const {form} = req.body;
  const {id} = req.params;
  if (!id || !form || !form.name || !form.comment || !form.organization || !form.indicator
    || !form.numericalValue || !form.startTime || !form.endTime || !form.dateCreated)
    throw new Server400Error('Wrong input');

  const indicatorReport = await GDBIndicatorReportModel.findOne({_id: id},
    {populates: ['hasTime.hasBeginning', 'hasTime.hasEnd', 'value.unitOfMeasure']});
  if (!indicatorReport)
    throw new Server400Error('No such Indicator Report');

  indicatorReport.name = form.name;
  indicatorReport.comment = form.comment;

  // update organization and indicator
  if (indicatorReport.forOrganization.split('_')[1] !== form.organization) {
    const organization = await GDBOrganizationModel.findOne({_id: form.organization});
    if (!organization)
      throw new Server400Error('No such organization');
    indicatorReport.forOrganization = organization;
  }
  if (indicatorReport.forIndicator.split('_')[1] !== form.indicator) {
    const indicator = await GDBIndicatorModel.findOne({_id: form.indicator}, {populates: ['unitOfMeasure']});
    if (!indicator)
      throw new Server400Error('No such indicator');
    indicatorReport.forIndicator = indicator;
    indicatorReport.value.unitOfMeasure = indicator.unitOfMeasure
  }

  if (form.startTime > form.endTime)
    throw new Server400Error('Start time must be earlier than end time');
  indicatorReport.hasTime.hasBeginning.date = new Date(form.startTime);
  indicatorReport.hasTime.hasEnd.date = new Date(form.endTime);
  indicatorReport.dateCreated = new Date(form.dateCreated);

  indicatorReport.value.numericalValue = form.numericalValue;

  await indicatorReport.save();
  return res.status(200).json({success: true});
};

const fetchIndicatorReportsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchIndicatorReports(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchIndicatorReports = async (req, res) => {
  const {orgId} = req.params;
  if (!orgId)
    throw new Server400Error('Wrong input');
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  const organization = await GDBOrganizationModel.findOne({_id: orgId});
  if (!organization)
    throw new Server400Error('No such organization');
  let editable;
  if (userAccount.isSuperuser || organization.editors?.includes(`:userAccount_${req.session._id}`)) {
    editable = true; // to tell the frontend that the outcome belong to the organization is editable
  }
  const indicatorReports = await GDBIndicatorReportModel.find({forOrganization: `:organization_${orgId}`},
    {populates: ['value.unitOfMeasure', 'hasTime.hasEnd', 'hasTime.hasBeginning']}
  );
  return res.status(200).json({success: true, indicatorReports, editable});
};

module.exports = {
  createIndicatorReportHandler,
  fetchIndicatorReportHandler,
  updateIndicatorReportHandler,
  fetchIndicatorReportsHandler
};