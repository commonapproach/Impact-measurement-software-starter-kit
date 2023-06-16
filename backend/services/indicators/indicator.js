const {json} = require("express");
const {GDBOrganizationModel} = require("../../models/organization");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBIndicatorModel} = require("../../models/indicator");
const {Server400Error} = require("../../utils");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBOwnershipModel} = require("../../models/ownership");
const {allReachableOrganizations, addObjectToList} = require("../../helpers");
const {GDBUnitOfMeasure} = require("../../models/measure");


const fetchIndicators = async (req, res) => {

  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  const {organizationUri} = req.params;
  if (!organizationUri) {
    // the organizationId is not given, return all indicators which is reachable by the user

    if (userAccount.isSuperuser) {
      // simple return all indicators to him
      const indicators = await GDBIndicatorModel.find({});
      indicators.map(indicator => indicator.editable = true);
      return res.status(200).json({success: true, indicators});
    }
    // take all reachable organizations
    const reachableOrganizations = await allReachableOrganizations(userAccount);
    const indicatorURIs = [];
    // fetch all available indicatorURIs from reachableOrganizations
    const editableIndicatorURIs = [];
    reachableOrganizations.map(organization => {
      if (organization.hasIndicators)
        organization.hasIndicators.map(indicatorURI => {
          if (addObjectToList(indicatorURIs, indicatorURI)) {
            // if the indicator is actually added
            if (organization.editors.includes(userAccount._uri)) {
              // and if the userAccount is one of the editor of the organization
              // the indicator will be marked
              editableIndicatorURIs.push(indicatorURI);
            }
          }
        });
    });
    // replace indicatorURIs to actual indicator objects
    const indicators = await Promise.all(indicatorURIs.map(indicatorURI => {
      return GDBIndicatorModel.findOne({_uri: indicatorURI}, {populates: ['unitOfMeasure']});
    }));
    // for all indicators, if its id in editableIndicatorIDs, then it is editable
    indicators.map(indicator => {
      if(editableIndicatorURIs.includes(indicator._uri))
        indicator.editable = true;
    })
    return res.status(200).json({success: true, indicators});
  } else {
    // the organizationUri is given, return all indicators belongs to the organization
    const organization = await GDBOrganizationModel.findOne({_uri: organizationUri},
      {populates: ['hasIndicators.unitOfMeasure', 'hasIndicators.indicatorReports.value',
          'hasIndicators.indicatorReports.hasTime.hasBeginning', 'hasIndicators.indicatorReports.hasTime.hasEnd']});
    if (!organization)
      throw new Server400Error('No such organization');
    if (!organization.hasIndicators)
      return res.status(200).json({success: true, indicators: []});
    let editable;
    if(userAccount.isSuperuser || organization.editors.includes(userAccount._uri)) {
      editable = true
      organization.hasIndicators.map(indicator => {
        indicator.editable = true;
      });
    }
    return res.status(200).json({success: true, indicators: organization.hasIndicators, editable});
  }


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
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('Id is not given');
  const indicator = await GDBIndicatorModel.findOne({_uri: uri}, {populates: ['unitOfMeasure']});
  indicator.unitOfMeasure = indicator.unitOfMeasure.label;
  if (!indicator)
    throw new Server400Error('No such indicator');
  indicator.forOrganizations = await Promise.all(indicator.forOrganizations.map(orgURI => {
    return GDBOrganizationModel.findOne({_uri: orgURI});
  }));
  indicator.organizations = indicator.forOrganizations.map(organization => {
    return organization._uri;
  });
  // indicator.forOrganizations.map(organization => {
  //   indicator.organizations[organization._id] = organization.legalName;
  // })
  delete indicator.forOrganizations;
  return res.status(200).json({success: true, indicator});

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

function cacheOrganization(organization, organizationDict) {
  if (!organizationDict[organization._uri])
    organizationDict[organization._uri] = organization;
}

function cacheListOfOrganizations(organizations, organizationDict) {
  organizations.map(organization => {
    cacheOrganization(organization, organizationDict);
  });
}

const updateIndicator = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('Uri is needed');
  if (!form || !form.description || !form.name || form.organizations.length === 0 || !form.unitOfMeasure)
    throw new Server400Error('Invalid input');
  const indicator = await GDBIndicatorModel.findOne({_uri: uri}, {populates: ['unitOfMeasure']});
  if (!indicator)
    throw new Server400Error('No such indicator');
  indicator.name = form.name;
  indicator.description = form.description;
  indicator.unitOfMeasure.label = form.unitOfMeasure
  const organizationDict = {};


  // fetch indicator.forOrganizations from database
  indicator.forOrganizations = await Promise.all(indicator.forOrganizations.map(organizationURI =>
    GDBOrganizationModel.findOne({_uri: organizationURI})
  ));
  // cache indicator.forOrganizations into dict
  cacheListOfOrganizations(indicator.forOrganizations, organizationDict);
  // fetch form.organizations from database
  form.organizations = await Promise.all(form.organizations.map(organizationUri => {
      // if the organization already in the dict, simply get from dict
      if (organizationDict[organizationUri])
        return organizationDict[organizationUri];
      // otherwise, fetch
      return GDBOrganizationModel.findOne({_uri: organizationUri});
    }
  ));
  // cache organizations which is not in dict
  cacheListOfOrganizations(form.organizations, organizationDict);


  // remove the indicator from every organizations in indicator.forOrganizations
  await Promise.all(indicator.forOrganizations.map(organization => {
    const index = organization.hasIndicators.indexOf(uri);
    organization.hasIndicators.splice(index, 1);
    organization.markModified('hasIndicators')
    return organization.save();
  }));

  // add the indicator to every organizations in form.organizations
  await Promise.all(form.organizations.map(organization => {
    if (!organization.hasIndicators)
      organization.hasIndicators = [];
    organization.hasIndicators.push(indicator);
    return organization.save();
  }));

  indicator.forOrganizations = form.organizations;
  await indicator.save();
  return res.status(200).json({success: true});

};

const updateIndicatorHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateIndicator'))
      return await updateIndicator(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const createIndicator = async (req, res) => {
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  if (!userAccount)
    throw new Server400Error('Wrong auth');
  const {form} = req.body;
  if (!form || !form.organizations || !form.name || !form.description || !form.unitOfMeasure)
    throw new Server400Error('Invalid input');
  form.forOrganizations = await Promise.all(form.organizations.map(organizationUri =>
    GDBOrganizationModel.findOne({_uri: organizationUri}, {populates: ['hasIndicators']})
  ));
  // for each organization, does it contain any indicator with same name?
  let duplicate = false
  let organizationInProblem
  form.forOrganizations.map(organization => {
    if(organization.hasIndicators){
      organization.hasIndicators.map(indicator => {
        if (indicator.name === form.name) {
          duplicate = true;
          organizationInProblem = organization._id;
        }
      });
    }
  })
  if (duplicate && organizationInProblem)
    return res.status(200).json({success: false, message: 'The name of the indicator has been occupied in organization ' + organizationInProblem});

  form.unitOfMeasure = GDBUnitOfMeasure({
    label: form.unitOfMeasure
  })
  const indicator = GDBIndicatorModel({
    name: form.name,
    description: form.description,
    forOrganizations: form.forOrganizations,
    unitOfMeasure: form.unitOfMeasure
  }, form.uri?{uri: form.uri}:null);

  await indicator.save();
  // add the indicator to the organizations
  await Promise.all(indicator.forOrganizations.map(organization => {
    if (!organization.hasIndicators)
      organization.hasIndicators = [];
    organization.hasIndicators.push(indicator);
    return organization.save();
  }));
  // const ownership = GDBOwnershipModel({
  //   resource: indicator,
  //   owner: userAccount,
  //   dateOfCreated: new Date(),
  // });
  // await ownership.save();
  return res.status(200).json({success: true});
};


module.exports = {updateIndicatorHandler, createIndicatorHandler, fetchIndicatorsHandler, fetchIndicatorHandler};