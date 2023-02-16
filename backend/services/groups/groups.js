const {GDBGroupModel} = require("../../models/group");
const {hasAccess} = require("../../helpers");
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
    return res.status(200).json({groups});
  }


};

const groupAdminFetchGroups = async (req, res, next) => {
  try {
    const groupAdminId = req.session._id;
    const groups = await GDBGroupModel.find({administrator: {_id: groupAdminId}});
    return res.status(200).json({groups});
  } catch (e) {
    next(e);
  }
};


module.exports = {fetchGroupsHandler, groupAdminFetchGroups};