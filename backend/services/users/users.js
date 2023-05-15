const {GDBUserAccountModel} = require("../../models/userAccount");
const {userType2UserTypeURI} = require("../../helpers/dicts");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOrganizationModel} = require("../../models/organization");
const {Server400Error} = require("../../utils");

const fetchUsers = async (req, res) => {
  if (req.params.orgId) {
    // will only fetch users belong to an organization
    const organization = await GDBOrganizationModel.findOne({_id: req.params.orgId}, {populates: ['hasUsers.person']});
    if (!organization)
      throw new Server400Error('No such organization');
    if (!organization.hasUsers)
      organization.hasUsers = []
    organization.hasUsers.map((user) => {
      delete user.hash;
      delete user.salt;
      delete user.securityQuestions;
    });
    return res.status(200).json({data: organization.hasUsers, success: true})

  } else {
    const users = await GDBUserAccountModel.find({}, {populates: ['person']});
    users.map((user) => {
      delete user.hash;
      delete user.salt;
      delete user.securityQuestions;
    });
    return res.status(200).json({data: users, success: true});
  }


};


const superuserDeleteUser = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (id === req.session._id)
      return res.status(400).json({success: false, message: 'A user cannot delete itself'});
    await GDBUserAccountModel.findByIdAndDelete(id);
    return res.status(200).json({success: true});
  } catch (e) {
    next(e);
  }
};

const fetchUsersHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchUsers'))
      return await fetchUsers(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};


module.exports = {superuserDeleteUser, fetchUsersHandler};