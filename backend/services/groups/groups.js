const {GDBGroupModel} = require("../../models/group");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBUserAccountModel} = require("../../models/userAccount");


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

  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  if (userAccount.isSuperuser) {
    const groups = await GDBGroupModel.find({});
    return res.status(200).json({success: true, groups});
  }
  if (userAccount.groupAdminOfs) {
    const groups = await GDBGroupModel.find({administrator: {_id: userAccount._id}});
    return res.status(200).json({success: true, groups});
  }

};



module.exports = {fetchGroupsHandler};