const {GDBOrganizationModel, GDBOrganizationIdModel} = require("../../models/organization");
const {addObjectToList, organizationsInSameGroups} = require("../../helpers");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBGroupModel} = require("../../models/group");
const {hasAccess} = require('../../helpers/hasAccess')

const fetchOrganizationsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchOrganizations'))
      return await fetchOrganizations(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchOrganizations = async (req, res) => {
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  let organizations = [];

  // if the user is the superuser, return all organizations to him
  if (userAccount.isSuperuser) {
    organizations = await GDBOrganizationModel.find({});
    return res.status(200).json({success: true, organizations: organizations});
  }

  // if the user is a group admin, add all organizations in his groups to the list
  if (userAccount.groupAdminOfs?.length) {
    // add all organization is his group in to the list
    // fetch all groups belongs to him
    const groups = await GDBGroupModel.find({administrator: {_id: userAccount._id}}, {populates: ['organizations']});
    groups.map(group => {
      group.organizations.map(organization => {
        // fetch all reachable organizations and add them in
        addObjectToList(organizations, organization);
      });
    });
  }
  // add organizations which the user associated with to the list
  (await Promise.all(userAccount.associatedOrganizations.map(orgURI => {
    return GDBOrganizationModel.findOne({_id: orgURI.split('_')[1]})
  }))).map(org => {
    addObjectToList(organizations, org)
  })
  // also add organizations which is same groups to the list
  let orgsInSameGroups = [];
  await organizationsInSameGroups(userAccount, orgsInSameGroups);
  orgsInSameGroups = await Promise.all(orgsInSameGroups.map(orgURI => {
    return GDBOrganizationModel.findOne({_id: orgURI.split('_')[1]});
  }));
  orgsInSameGroups.map(org => {
    addObjectToList(organizations, org)
  });

  return res.status(200).json({success: true, organizations: organizations});

};

module.exports = {
  fetchOrganizationsHandler,
};