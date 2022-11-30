const {GDBGroupModel} = require("../../models/group");
const createGroup = async (req, res, next) => {
  try {
    const form = req.body;
    if (!form || !form.label)
      return res.status(400).json({success: false, message: 'Wrong information given'});
    const group = GDBGroupModel(form)
    await group.save()
    return res.status(200).json({success: true})
  } catch (e) {
    next(e);
  }
};

module.exports = {createGroup};