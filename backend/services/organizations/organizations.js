const {GDBOrganizationModel} = require("../../models/organization");
const {allReachableOrganizations} = require("../../helpers");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {hasAccess} = require('../../helpers/hasAccess')
const {GDBGroupModel} = require("../../models/group");

const fetchOrganizationsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchOrganizations'))
      return await fetchOrganizations(req, res); // todo: handle the case that the option is based on groupUri
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchOrganizationsInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchOrganizationsInterfaces'))
      return await fetchOrganizationsInterfaces(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchOrganizationsInterfaces = async (req, res) => {
  const organizations = await GDBOrganizationModel.find({});
  const ret = organizations.map(org => ({legalName: org.legalName, _uri: org._uri}));
  return res.status(200).json({organizations: ret, success: true});
}

const fetchOrganizations = async (req, res) => {
  const {groupUri} = req.params
  if (!groupUri) {
    const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
    // let organizations = [];

    // if the user is the superuser, return all organizations to him
    if (userAccount.isSuperuser) {
      const organizations = await GDBOrganizationModel.find({}, {populates: ['administrator.person']});
      organizations.map(organization => {
        if(organization.administrator) {
          organization.administrator = `${organization.administrator._uri}: ${organization.administrator.person.givenName} ${organization.administrator.person.familyName}`
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
      if(organization.administrator?._uri === userAccount._uri)
        organization.editable = true;
      organization.administrator = organization.administrator? `${organization.administrator._uri}: ${organization.administrator.person.givenName} ${organization.administrator.person.familyName}`: null
    })

    return res.status(200).json({success: true, organizations: organizations});
  } else {
    // fetch organizations based on groupURI
    const group = await GDBGroupModel.findOne({_uri: groupUri}, {populates: ['organizations']});
    return res.status(200).json({success: true, organizations: group.organizations})
  }


};

module.exports = {
  fetchOrganizationsHandler, fetchOrganizationsInterfacesHandler
};