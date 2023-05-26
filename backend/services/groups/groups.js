const {GDBGroupModel} = require("../../models/group");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBOrganizationModel} = require("../../models/organization");


const fetchGroupsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchGroups'))
      return await fetchGroups(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchGroups = async (req, res) => {

  const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
  if (userAccount.isSuperuser) {
    const groups = await GDBGroupModel.find({}, {populates: ['administrator.person']});
    groups.map(group => {
      group.administrator = `${group.administrator._uri}: ${group.administrator.person.givenName} ${group.administrator.person.familyName}`
    })
    return res.status(200).json({success: true, groups});
  }
  if (userAccount.groupAdminOfs) {
    const groups = await GDBGroupModel.find({administrator: {_uri: userAccount._uri}}, {populates: ['administrator.person']});
    groups.map(group => {
      group.administrator = `${group.administrator._uri}: ${group.administrator.person.givenName} ${group.administrator.person.familyName}`
    })
    return res.status(200).json({success: true, groups});
  }

  // todo: for regular users
  const associatedOrganizations = userAccount.associatedOrganizations;



};



module.exports = {fetchGroupsHandler};