const {hasAccess} = require("../../helpers");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBDateTimeIntervalModel} = require("../../models/time");
const {GDBMeasureModel} = require("../../models/measure");

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
  const {form} = req.body;
  if (!form || !form.name || !form.comment || !form.organization || !form.indicator
    || !form.numericalValue || !form.unitOfMeasure || !form.startTime || !form.endTime)
    throw new Server400Error('Wrong input');

  const organization = await GDBOrganizationModel.findOne({_id: form.organization});
  if (!organization)
    throw new Server400Error('No such organization');
  const indicator = await GDBIndicatorModel.findOne({_id: form.indicator});
  if (!indicator)
    throw new Server400Error('No such indicator');

  const indicatorReport = GDBIndicatorReportModel({
    name: form.name,
    comment: form.comment,
    forOrganization: organization,
    forIndicator: indicator,
    hasTime: GDBDateTimeIntervalModel({
      hasBeginning: {date: new Date(form.startTime)},
      hasEnd: {date: new Date(form.endTime)}
    }),
    value: GDBMeasureModel({numericalValue: form.numericalValue, unitOfMeasure: {label: form.unitOfMeasure}}),
  });

  await indicatorReport.save();
  return res.status(200).json({success: true});

};

module.exports = {createIndicatorReportHandler};