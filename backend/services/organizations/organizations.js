const {GDBOrganizationModel, GDBOrganizationIdModel} = require("../../models/organization");
const {addObjectToList, organizationsInSameGroups, allReachableOrganizations} = require("../../helpers");
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
  // let organizations = [];

  // if the user is the superuser, return all organizations to him
  if (userAccount.isSuperuser) {
    const organizations = await GDBOrganizationModel.find({});
    return res.status(200).json({success: true, organizations: organizations});
  }

  const organizations = await allReachableOrganizations(userAccount);

  return res.status(200).json({success: true, organizations: organizations});

};

module.exports = {
  fetchOrganizationsHandler,
};