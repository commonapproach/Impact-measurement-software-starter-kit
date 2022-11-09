const {GDBUserAccountModel} = require("../../models/userAccount");

const superUserFetchUsers = async (req, res, next) => {
  const users = await GDBUserAccountModel.find({}, {populates: 'person'});
  return res.status(200).json({data: users, success: true});
}


module.exports = {superUserFetchUsers}