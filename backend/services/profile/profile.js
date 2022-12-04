const {GDBUserAccountModel} = require("../../models/userAccount");
const regularUserGetProfile = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    const userAccount = await GDBUserAccountModel.findOne({_id: id}, {populates: ['person']});
    if (!userAccount)
      return res.status(400).json({success: false, message: 'No such user'});
    if (!userAccount.person)
      return res.status(400).json({success: false});
    delete userAccount.person.email
    return res.status(200).json({success: true, person: userAccount.person});

  } catch (e) {
    next(e);
  }
};

module.exports = {regularUserGetProfile};