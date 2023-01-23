const {GDBUserAccountModel} = require("../../models/userAccount");

const superuserFetchUserById = async (req, res, next) => {
  try{
    const {id} = req.params;
    if(!id)
      return res.status(400).json({success: false, message: 'Id should be given'})
    const user = await GDBUserAccountModel.findOne({_id: id});
    if(!user)
      return res.status(400).json({success: false, message: 'No such user'});
    delete user.salt;
    delete user.hash;
    delete user.securityQuestions;
    // const newUserTypes = {}
    // user.userTypes.map((userTypeURI)=>{
    //   newUserTypes[userTypeURI] = userTypeURI2UserType[userTypeURI];
    // })
    // user.userTypes = newUserTypes;
    return res.status(200).json({success: true, user: user});
  }catch (e){
    next(e);
  }

}

const superuserUpdateUserById = async (req, res, next) => {
  try {
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
  } catch (e) {
    next(e);
  }
}

module.exports = {superuserFetchUserById, superuserUpdateUserById}