const {GDBOrganizationModel} = require("../../models/organization");
const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {GDBDomainModel} = require("../../models/domain");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOwnershipModel} = require("../../models/ownership");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBIndicatorModel} = require("../../models/indicator");
const {allReachableOrganizations, addObjectToList} = require("../../helpers");


const fetchOutcomes = async (req, res) => {

  const {organizationId} = req.params;
  if (!organizationId) {
    // the organizationId is not given, return all outcomes which is reachable by the user
    const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
    if (userAccount.isSuperuser) {
      // simple return all indicators to him
      const outcomes = await GDBOutcomeModel.find({});
      outcomes.map(outcome => outcome.editable = true)
      return res.status(200).json({success: true, outcomes, editable:true});
    }
    // take all reachable organizations
    const reachableOrganizations = await allReachableOrganizations(userAccount);
    const outcomeURIs = [];
    // fetch all available indicatorURIs from reachableOrganizations
    reachableOrganizations.map(organization => {
      if (organization.hasOutcomes)
        organization.hasOutcomes.map(outcomeURI => {
          addObjectToList(outcomeURIs, outcomeURI);
        });
    });
    // replace indicatorURIs to actual indicator objects
    const outcomes = await Promise.all(outcomeURIs.map(outcomeURI => {
      return GDBOutcomeModel.findOne({_id: outcomeURI.split('_')[1]});
    }));
    return res.status(200).json({success: true, outcomes});
  } else {
    // the organizationId is given, return all outcomes belongs to the organization
    const organization = await GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasOutcomes']});
    if (!organization)
      throw new Server400Error('No such organization');
    let editable;
    if (organization.editors?.includes(`:userAccount_${req.session._id}`) || req.session.isSuperuser) {
      editable = true; // to tell the frontend that the outcome belong to the organization is editable
      organization.hasOutcomes?.map(outcome => outcome.editable = true);
    }
    if (!organization.hasOutcomes)
      return res.status(200).json({success: true, outcomes: [], editable});

    return res.status(200).json({success: true, outcomes: organization.hasOutcomes, editable});
  }


};

const fetchOutcomesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchOutcomes'))
      return await fetchOutcomes(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchOutcomeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchOutcome'))
      return await fetchOutcome(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchOutcome = async (req, res) => {
  const {id} = req.params;
  if (!id)
    throw new Server400Error('Id is not given');
  const outcome = await GDBOutcomeModel.findOne({_id: id});
  if (!outcome)
    throw new Server400Error('No such outcome');
  outcome.domain = outcome.domain.split('_')[1];
  outcome.forOrganizations = await Promise.all(outcome.forOrganizations.map(orgURI => {
    return GDBOrganizationModel.findOne({_id: orgURI.split('_')[1]});
  }));
  outcome.organizations = outcome.forOrganizations.map(organization => {
    return organization._id;
  });
  // indicator.forOrganizations.map(organization => {
  //   indicator.organizations[organization._id] = organization.legalName;
  // })
  delete outcome.forOrganizations;
  return res.status(200).json({success: true, outcome});

};

const createOutcomeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createOutcome'))
      return await createOutcome(req, res);
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

const updateOutcome = async (req, res) => {
  const {form} = req.body;
  const {id} = req.params;
  if (!id)
    throw new Server400Error('Id is needed');
  if (!form || !form.description || !form.name || form.organizations.length === 0 || !form.domain)
    throw new Server400Error('Invalid input');
  const outcome = await GDBOutcomeModel.findOne({_id: id});
  if (!outcome)
    throw new Server400Error('No such outcome');
  outcome.name = form.name;
  outcome.description = form.description;
  if (outcome.domain.split('_')[1] !== form.domain) {
    // domain have to be updated
    const newDomain = await GDBDomainModel.findOne({_id: form.domain});
    if (!newDomain)
      throw new Server400Error('No such domain');
    outcome.domain = newDomain;
  }
  const organizationDict = {};

  // fetch outcome.forOrganizations from database
  outcome.forOrganizations = await Promise.all(outcome.forOrganizations.map(organizationURI =>
    GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]})
  ));
  // cache outcome.forOrganizations into dict
  cacheListOfOrganizations(outcome.forOrganizations, organizationDict);
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

  // remove the outcome from every organizations in outcome.forOrganizations
  await Promise.all(outcome.forOrganizations.map(organization => {
    const index = organization.hasOutcomes.findIndex(outcome => outcome._id === id);
    organization.hasOutcomes.splice(index, 1);
    return organization.save();
  }));

  // add the outcome to every organizations in form.organizations
  await Promise.all(form.organizations.map(organization => {
    if (!organization.hasOutcomes)
      organization.hasOutcomes = [];
    organization.hasOutcomes.push(outcome);
    return organization.save();
  }));

  outcome.forOrganizations = form.organizations;
  await outcome.save();
  return res.status(200).json({success: true});
};

const updateOutcomeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateOutcome'))
      return await updateOutcome(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const createOutcome = async (req, res) => {
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  if (!userAccount)
    throw new Server400Error('Wrong auth');
  const {form} = req.body;

  if (form?.domainName) { // handle the case when no such indicator name
    const domain = await GDBDomainModel.findOne({name: form.domainName});
    if (!domain)
      return res.status(200).json({success: false, message: 'Wrong domainName'})
    form.domain = domain._id;
  }
  if (!form || !form.organizations || !form.name || !form.description || !form.domain)
    throw new Server400Error('Invalid input');
  form.forOrganizations = await Promise.all(form.organizations.map(organizationId =>
    GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasOutcomes']})
  ));

  // for each organization, does it contain any indicator with same name?
  let duplicate = false
  let organizationInProblem
  form.forOrganizations.map(organization => {
    if(organization.hasOutcomes){
      organization.hasOutcomes.map(outcome => {
        if (outcome.name === form.name) {
          duplicate = true;
          organizationInProblem = organization._id;
        }
      });
    }
  })
  if (duplicate && organizationInProblem)
    return res.status(200).json({success: false, message: 'The name of the outcome has been occupied in organization ' + organizationInProblem})

  form.domain = await GDBDomainModel.findOne({_id: form.domain});
  if (!form.domain)
    throw new Server400Error('No such domain');

  const outcome = GDBOutcomeModel(form);
  await outcome.save();
  // add the outcome to the organizations
  await Promise.all(outcome.forOrganizations.map(organization => {
    if (!organization.hasOutcomes)
      organization.hasOutcomes = [];
    organization.hasOutcomes.push(outcome);
    return organization.save();
  }));
  const ownership = GDBOwnershipModel({
    resource: outcome,
    owner: userAccount,
    dateOfCreated: new Date(),
  });
  await ownership.save();
  return res.status(200).json({success: true});
};


module.exports = {updateOutcomeHandler, createOutcomeHandler, fetchOutcomesHandler, fetchOutcomeHandler};