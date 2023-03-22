const {json} = require("express");
const {GDBOrganizationModel} = require("../../models/organization");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBIndicatorModel} = require("../../models/indicator");
const {Server400Error} = require("../../utils");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBOwnershipModel} = require("../../models/ownership");
const {allReachableOrganizations, addObjectToList} = require("../../helpers");


const fetchIndicators = async (req, res) => {

  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  const {organizationId} = req.params;
  if (!organizationId) {
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
    const editableIndicatorIDs = [];
    reachableOrganizations.map(organization => {
      if (organization.hasIndicators)
        organization.hasIndicators.map(indicatorURI => {
          if (addObjectToList(indicatorURIs, indicatorURI)) {
            // if the indicator is actually added
            if (organization.editors.includes(`:userAccount_${userAccount._id}`)) {
              // and if the userAccount is one of the editor of the organization
              // the indicator will be marked
              editableIndicatorIDs.push(indicatorURI.split('_')[1]);
            }
          }
        });
    });
    // replace indicatorURIs to actual indicator objects
    const indicators = await Promise.all(indicatorURIs.map(indicatorURI => {
      return GDBIndicatorModel.findOne({_id: indicatorURI.split('_')[1]});
    }));
    // for all indicators, if its id in editableIndicatorIDs, then it is editable
    indicators.map(indicator => {
      if(editableIndicatorIDs.includes(indicator._id))
        indicator.editable = true;
    })
    return res.status(200).json({success: true, indicators});
  } else {
    // the organizationId is given, return all indicators belongs to the organization
    const organization = await GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasIndicators']});
    if (!organization)
      throw new Server400Error('No such organization');
    if (!organization.hasIndicators)
      return res.status(200).json({success: true, indicators: []});
    let editable;
    if(userAccount.isSuperuser || organization.editors.includes(`:userAccount_${userAccount._id}`)) {
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
  const {id} = req.params;
  if (!id)
    throw new Server400Error('Id is not given');
  const indicator = await GDBIndicatorModel.findOne({_id: id});
  if (!indicator)
    throw new Server400Error('No such indicator');
  indicator.forOrganizations = await Promise.all(indicator.forOrganizations.map(orgURI => {
    return GDBOrganizationModel.findOne({_id: orgURI.split('_')[1]});
  }));
  indicator.organizations = indicator.forOrganizations.map(organization => {
    return organization._id;
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
  if (!organizationDict[organization._id])
    organizationDict[organization._id] = organization;
}

function cacheListOfOrganizations(organizations, organizationDict) {
  organizations.map(organization => {
    cacheOrganization(organization, organizationDict);
  });
}

const updateIndicator = async (req, res) => {
  const {form} = req.body;
  const {id} = req.params;
  if (!id)
    throw new Server400Error('Id is needed');
  if (!form || !form.description || !form.name || form.organizations.length === 0)
    throw new Server400Error('Invalid input');
  const indicator = await GDBIndicatorModel.findOne({_id: id});
  if (!indicator)
    throw new Server400Error('No such indicator');
  indicator.name = form.name;
  indicator.description = form.description;
  const organizationDict = {};


  // fetch indicator.forOrganizations from database
  indicator.forOrganizations = await Promise.all(indicator.forOrganizations.map(organizationURI =>
    GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]})
  ));
  // cache indicator.forOrganizations into dict
  cacheListOfOrganizations(indicator.forOrganizations, organizationDict);
  // fetch form.organizations from database
  form.organizations = await Promise.all(form.organizations.map(organizationId => {
      // if the organization already in the dict, simply get from dict
      if (organizationDict[organizationId])
        return organizationDict[organizationId];
      // otherwise, fetch
      return GDBOrganizationModel.findOne({_id: organizationId});
    }
  ));
  // cache organizations which is not in dict
  cacheListOfOrganizations(form.organizations, organizationDict);


  // remove the indicator from every organizations in indicator.forOrganizations
  await Promise.all(indicator.forOrganizations.map(organization => {
    const index = organization.hasIndicators.findIndex(indicator => indicator._id === id);
    organization.hasIndicators.splice(index, 1);
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
  if (!form || !form.organizations || !form.name || !form.description)
    throw new Server400Error('Invalid input');
  form.forOrganizations = await Promise.all(form.organizations.map(organizationId =>
    GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasIndicators']})
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

  const indicator = GDBIndicatorModel(form);
  await indicator.save();
  // add the indicator to the organizations
  await Promise.all(indicator.forOrganizations.map(organization => {
    if (!organization.hasIndicators)
      organization.hasIndicators = [];
    organization.hasIndicators.push(indicator);
    return organization.save();
  }));
  const ownership = GDBOwnershipModel({
    resource: indicator,
    owner: userAccount,
    dateOfCreated: new Date(),
  });
  await ownership.save();
  return res.status(200).json({success: true});
};


module.exports = {updateIndicatorHandler, createIndicatorHandler, fetchIndicatorsHandler, fetchIndicatorHandler};