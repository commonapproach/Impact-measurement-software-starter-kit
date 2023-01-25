const {GDBUserAccountModel} = require("../../models/userAccount");
const {userType2UserTypeURI} = require("../../helpers/dicts");
const {GraphDB} = require('../../utils/graphdb');
const {SPARQL} = require('../../utils/graphdb/helpers');
const superUserFetchUsers = async (req, res, next) => {
  try {
      const users = await GDBUserAccountModel.find({}, {populates: ['person']});
      users.map((user) => {
        delete user.hash;
        delete user.salt;
        delete user.securityQuestions;
      })
      return res.status(200).json({data: users, success: true});

  } catch (e) {
    next(e);
  }

};

const adminFetchUsers = superUserFetchUsers;

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


module.exports = {superUserFetchUsers, superuserDeleteUser, adminFetchUsers};