const {GDBUserAccountModel} = require("../../models/userAccount");
const {hasAccess} = require("../../helpers/hasAccess");

const fetchUserHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchUser'))
      return await fetchUser(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateUserHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateUser'))
      return await updateUser(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchUser = async (req, res) => {
    const {id} = req.params;
    if(!id)
      return res.status(400).json({success: false, message: 'Id should be given'})
    const user = await GDBUserAccountModel.findOne({_id: id});
    if(!user)
      return res.status(400).json({success: false, message: 'No such user'});
    delete user.salt;
    delete user.hash;
    delete user.securityQuestions;
    return res.status(200).json({success: true, user: user});

}

const updateUser= async (req, res) => {
    const {id} = req.params;
    const {email,} = req.body;
    if(!id)
      return res.status(400).json({success: false, message: 'Wrong URI'});
    if(!email)
      return res.status(400).json({success: false, message: 'Wrong information given'});
    const user = await GDBUserAccountModel.findOne({_id: id, email: email});
    if (!user)
      return res.status(400).json({success: false, message: 'No such user'});
    await user.save();
    return res.status(200).json({success: true});
}

module.exports = {fetchUserHandler, updateUserHandler}