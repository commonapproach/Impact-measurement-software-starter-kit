const {GDBGroupModel} = require("../../models/group");
const superuserFetchGroups = async (req, res, next) => {
  try {
    const groups = await GDBGroupModel.find({});
    return res.status(200).json({groups});
  } catch (e) {
    next(e);
  }
};

const groupAdminFetchGroups = async (req, res, next) => {
  try {
    const groupAdminId = req.session._id;
    const groups = await GDBGroupModel.find({administrator: {_id: groupAdminId}})
    return res.status(200).json({groups})
  } catch (e) {
    next(e);
  }
};


module.exports = {superuserFetchGroups, groupAdminFetchGroups};