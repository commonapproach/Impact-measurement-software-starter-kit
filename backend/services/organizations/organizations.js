const {GDBOrganizationModel, GDBOrganizationIdModel} = require("../../models/organization");
const {hasAccess, addObjectToList, organizationsInSameGroups} = require("../../helpers");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBGroupModel} = require("../../models/group");

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

  if (userAccount.isSuperuser) {
    organizations = await GDBOrganizationModel.find({});
    return res.status(200).json({success: true, organizations: organizations});
  }

  if (userAccount.groupAdminOfs?.length) {
    // add all organization is his group in to the list

    // fetch all groups belongs to him
    const groups = await GDBGroupModel.find({administrator: {_id:userAccount._id}}, {populates: ['organizations']})
    groups.map(group => {
      group.organizations.map(organization => {
        // fetch all reachable organizations and add them in
        addObjectToList(organizations, organization);
      })
    })
  }

  if (userAccount.administratorOfs?.length){
    // await organizationsInSameGroups(userAccount, 'administratorOfs', )
  }



  return res.status(200).json({success: true, organizations: organizations});

};


const adminFetchOrganizations = async (req, res, next) => {

  const sessionId = req.session._id;
  const organizations = await GDBOrganizationModel.find({administrator: {_id: sessionId}});
  return res.status(200).json({success: true, organizations});

};

module.exports = {
  fetchOrganizationsHandler,
};