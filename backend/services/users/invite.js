const {sign} = require("jsonwebtoken");
const {jwtConfig} = require("../../config");
const {sendVerificationMail} = require("../../utils");
const {Server400Error} = require("../../utils");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOrganizationModel} = require("../../models/organization");

const inviteNewUserHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'inviteNewUser'))
      return await inviteNewUser(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const inviteNewUser = async (req, res) => {

  let {email, firstName, lastName, middleName, associatedOrganizations, uri} = req.body.form;
  if (!email)
    return res.status(400).json({success: false, message: 'Email is required to invite new user.'});
  if (!firstName || !lastName)
    return res.status(400).json({success: false, message: 'Name is required to invite new user.'});
  if (!associatedOrganizations || !associatedOrganizations.length)
    throw new Server400Error('The user must be sponsored by at least one organization')

  email = email.toLowerCase();
  // userTypes.map(userType => {
  //   if (!userTypeURI2UserType[userType])
  //     throw new Server400Error('userTypes is not valid.');
  // })

  const userAccount = await GDBUserAccountModel.findOne(
    {email: email}, {populates: ['person']}
  );

  if (!userAccount) {
    // the user is a new user, store its data inside the database
    const userAccount = GDBUserAccountModel({
      email,
      isSuperuser: false,
      associatedOrganizations: associatedOrganizations // contains organization URIs
    }, uri?{uri}:null);
    associatedOrganizations = await Promise.all(associatedOrganizations.map(
      organizationURI => GDBOrganizationModel.findOne({_uri: organizationURI})
    )); // fetch organizations from the databse
    userAccount.person = {givenName: firstName, familyName: lastName, middleName};
    // send email
    const token = sign({
      email
    }, jwtConfig.secret, jwtConfig.options);
    console.log(token)
    await sendVerificationMail(email, token);
    await userAccount.save();
    await Promise.all(associatedOrganizations.map(organization => {
      if (!organization.hasUsers)
        organization.hasUsers = [];
      organization.hasUsers.push(userAccount)
      return organization.save();
    }))
    return res.status(201).json({success: true, message: 'Successfully invited user.'});
  } else if (userAccount.securityQuestions) {
    // the user already exists, and has been activated.
    return res.status(400).json({success: false, message: 'The email is occupied by an account.'});
  } else {
    // the user is already a temporary user
    userAccount.isSuperuser = false;
    userAccount.person.middleName = middleName;
    userAccount.person.givenName = firstName;
    userAccount.person.familyName = lastName;
    const token = sign({
      email
    }, jwtConfig.secret, jwtConfig.options);
    await sendVerificationMail(email, token);
    await userAccount.save();
    return res.status(201).json({success: true, message: 'The user have been invited again.'});
  }

};


module.exports = {inviteNewUserHandler};
