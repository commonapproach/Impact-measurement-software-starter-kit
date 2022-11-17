const {GDBUserAccountModel} = require("../../models/userAccount");

const superUserFetchUsers = async (req, res, next) => {
  const users = await GDBUserAccountModel.find({}, {populates: 'person'});
  return res.status(200).json({data: users, success: true});
}

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
}


module.exports = {superUserFetchUsers, superuserDeleteUser}