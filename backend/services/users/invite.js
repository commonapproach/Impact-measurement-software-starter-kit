const {JsonWebTokenError, sign} = require("jsonwebtoken");
const {findUserAccountByEmail} = require('../userAccount/user');
const {jwtConfig} = require("../../config");
const {sendVerificationMail} = require("../../utils");
const { userTypeURI2UserType} = require("../../helpers/dicts");
const {Server400Error} = require("../../utils");
const {GDBUserAccountModel} = require("../../models/userAccount");


/**
 * this function create a new temporary user account and send a verification email to him
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const inviteNewUser = async (req, res, next) => {


  try {
    let {email, userTypes, firstName, lastName, middleName} = req.body.form;
    if (!email)
      return res.status(400).json({success: false, message: 'Email is required to invite new user.'});
    if (!userTypes)
      return res.status(400).json({success: false, message: 'userTypes is required to invite new user.'});
    if (!Array.isArray(userTypes) || userTypes.length === 0)
      return res.status(400).json({success: false, message: 'userTypes is not valid.'});
    if(!firstName || !lastName)
      return res.status(400).json({success: false, message: 'Name is required to invite new user.'});

    email = email.toLowerCase();
    userTypes.map(userType => {
      if (!userTypeURI2UserType[userType])
        throw new Server400Error('userTypes is not valid.');
    })

    const userAccount = await GDBUserAccountModel.findOne(
      {email: email}, {populates: ['person']}
    );
    if(!userAccount){
      // the user is a new user, store its data inside the database
      const userAccount = GDBUserAccountModel({
        email, userTypes
      });
      userAccount.person = {givenName: firstName, familyName: lastName, middleName}
      // send email
      const token = sign({
        email
      }, jwtConfig.secret, jwtConfig.options);
      await sendVerificationMail(email, token);
      await userAccount.save();
      return res.status(201).json({success: true, message: 'Successfully invited user.'});
    } else if (userAccount.securityQuestions){
      // the user already exists, and has been activated.
      return res.status(400).json({success: false, message: 'The email is occupied by an account.'});
    } else {
      // the user is already a temporary user
      userAccount.userTypes = userTypes;
      userAccount.person.middleName = middleName;
      userAccount.person.givenName = firstName;
      userAccount.person.familyName = lastName;
      const token = sign({
        email
      }, jwtConfig.secret, jwtConfig.options);
      await sendVerificationMail(email, token);
      await userAccount.save();
      return res.status(201).json({success: true, message: 'Successfully invited user.'});
    }

  } catch (e) {
    return next(e);
  }
};


module.exports = {inviteNewUser};
