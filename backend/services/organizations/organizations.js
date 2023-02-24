const {GDBOrganizationModel} = require("../../models/organization");
const {allReachableOrganizations} = require("../../helpers");
const {GDBUserAccountModel} = require("../../models/userAccount");
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
    const organizations = await GDBOrganizationModel.find({}, {populates: ['administrator.person']});
    organizations.map(organization => {
      if(organization.administrator) {
        organization.administrator = `${organization.administrator._id}: ${organization.administrator.person.givenName} ${organization.administrator.person.familyName}`
      } else {
        // organization may doesn't have admin
        organization.administrator = ''
      }
      organization.editable = true;
    })
    return res.status(200).json({success: true, organizations: organizations});
  }

  const organizations = await allReachableOrganizations(userAccount);
  organizations.map(organization => {
    // if the organization is administrated by the user, set it as editable
    if(organization.administrator._id === userAccount._id)
      organization.editable = true;
    organization.administrator = `${organization.administrator._id}: ${organization.administrator.person.givenName} ${organization.administrator.person.familyName}`
  })

  return res.status(200).json({success: true, organizations: organizations});

};

module.exports = {
  fetchOrganizationsHandler,
};