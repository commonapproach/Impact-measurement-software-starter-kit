const {json} = require("express");
const {GDBOrganizationModel} = require("../../models/organization");
const {hasAccess} = require("../../helpers");
const {GDBIndicatorModel} = require("../../models/indicator");


const fetchIndicators = async (req, res) => {

  const {organizationId} = req.params;
  if (!organizationId)
    return res.status(400).json({success: false, message: 'organizationId is needed'});
  const organization = await GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasIndicators']});
  if (!organization)
    return res.status(400).json({success: false, message: 'No such organization'});
  if (!organization.hasIndicators)
    return res.status(200).json({success: true, indicators: []});
  return res.status(200).json({success: true, indicators: organization.hasIndicators});

};

const fetchIndicatorsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchIndicators'))
      return await fetchIndicators(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchIndicatorHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchIndicator'))
      return await fetchIndicator(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchIndicator = async (req, res) => {
  const {id} = req.params;
  const indicator = await GDBIndicatorModel.findOne({_id: id});
  indicator.forOrganizations = await Promise.all(indicator.forOrganizations.map(orgURI => {
    return GDBOrganizationModel.findOne({_id: orgURI.split('_')[1]});
  }));

};

const createIndicatorHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createIndicator'))
      return await createIndicator(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const createIndicator = async (req, res) => {
  const {form} = req.body;
  if (!form || !form.organizations || !form.name || !form.description)
    throw new Server400Error('Invalid input');
  form.forOrganizations = await Promise.all(form.organizations.map(organizationId =>
    GDBOrganizationModel.findOne({_id: organizationId})
  ));

  const indicator = GDBIndicatorModel(form);
  await indicator.save();
  // add the indicator to the organizations
  const list = await Promise.all(indicator.forOrganizations.map(organization => {
    if (!organization.hasIndicators)
      organization.hasIndicators = []
    organization.hasIndicators.push(indicator);
    return organization.save();
  }));
  return res.status(200).json({success: true});
};


module.exports = {createIndicatorHandler, fetchIndicatorsHandler, fetchIndicatorHandler};