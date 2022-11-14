const {verify, JsonWebTokenError} = require("jsonwebtoken");
const {jwtConfig} = require("../../config");
const {GDBUserAccountModel} = require("../../models/userAccount");


const verifyUser = async (req, res, next) => {


  try{
    const {token} = req.body;
    if(!token)
      return res.status(400).json('Token is needed to verify.');

    const {email} = verify(token, jwtConfig.secret);
    if(!email)
      return res.status(400).json('Wong token form')
    const userAccount = await GDBUserAccountModel.findOne({email: email})
    if (!userAccount){
      return res.status(400).json({success: false, message: "No such user"})
    }
    if (userAccount.securityQuestions){
      return res.status(400).json({success: false, message: "The user is verified already"})
    }
    return res.status(200).json({success: true, message:'success', email: userAccount.email, userId: userAccount._id})
  } catch (e){
    if (e instanceof JsonWebTokenError && e.message === 'invalid token' || e instanceof SyntaxError)
      return res.status(400).json({success: false, message: 'Invalid request.'})
    if (e instanceof JsonWebTokenError && e.message === 'jwt expired')
      return res.status(400).json({success: false, message: 'More than 24 hours passed, please make the admin user invite you again.'})

    return next(e)
  }

}


module.exports = {verifyUser}