const {GDBUserAccountModel} = require("../../models/userAccount");
const {genderOptions} = require("../../helpers/dicts");
const {Validator} = require("../../helpers/validator");
const {SPARQL} = require('../../utils/graphdb/helpers');
const {validateCredentials, updateUserPassword} = require("../userAccount/user");
const Hashing = require("../../utils/hashing");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOrganizationModel} = require("../../models/organization");


const fetchProfileHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchProfile'))
      return await fetchProfile(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateProfileHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateProfile'))
      return await updateProfile(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchProfile = async (req, res) => {

  const {id} = req.params;
  if (!id)
    return res.status(400).json({success: false, message: 'Id is needed'});
  const userAccount = await GDBUserAccountModel.findOne({_id: id}, {populates: ['person.phoneNumber', 'person.address']});
  if (!userAccount)
    return res.status(400).json({success: false, message: 'No such user'});
  if (!userAccount.person)
    return res.status(400).json({success: false});
  delete userAccount.person.email;
  if (userAccount.person.address) {
    userAccount.person.address.streetDirection = SPARQL.getFullURI(userAccount.person.address.streetDirection);
    userAccount.person.address.streetType = SPARQL.getFullURI(userAccount.person.address.streetType);
    userAccount.person.address.state = SPARQL.getFullURI(userAccount.person.address.state);
  }

  return res.status(200).json({success: true, person: userAccount.person});

};

const replaceSecurityQuestions = async (securityQuestions, newSecurityQuestions) => {
  for (let i = 0; i < securityQuestions.length; i++) {
    securityQuestions[i].question = newSecurityQuestions[`group${i + 1}`][`securityQuestion${i + 1}`];
    const {
      hash,
      salt
    } = await Hashing.hashPassword(newSecurityQuestions[`group${i + 1}`][`securityQuestionAnswer${i + 1}`]);
    securityQuestions[i].hash = hash;
    securityQuestions[i].salt = salt;
  }
};

const regularUserUpdateSecurityQuestions = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {form, checkedAnswer, checkedQuestion} = req.body;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    if (!form || !checkedAnswer || !checkedQuestion)
      return res.status(400).json({success: true, message: 'Wrong information given'});
    const userAccount = await GDBUserAccountModel.findOne({_id: id}, {populates: ['securityQuestions']});
    if (!userAccount)
      return res.status(400).json({success: false, message: 'No such user'});
    if (!userAccount.securityQuestions)
      return res.status(400).json({success: false, message: 'The user is not registered'});

    for (let i in userAccount.securityQuestions) {
      let securityQuestion = userAccount.securityQuestions[i];
      if (securityQuestion.question === checkedQuestion) {
        const match = await Hashing.validatePassword(checkedAnswer, securityQuestion.hash, securityQuestion.salt);
        if (match) {
          // update security Questions
          await replaceSecurityQuestions(userAccount.securityQuestions, form);
          await userAccount.save();
          return res.status(200).json({success: true, message: 'Successfully Updated Security Questions'});
        } else {
          return res.status(400).json({
            success: false,
            message: 'Please firstly correctly answer the current security question'
          });
        }
      }
    }
    return res.status(400).json({
      success: false,
      message: 'Please firstly correctly answer the current security question'
    });

  } catch (e) {
    next(e);
  }

};

const regularUserUpdatePassword = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {newPassword, currentPassword} = req.body;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    if (!newPassword || !currentPassword)
      return res.status(400).json({success: false, message: 'Information invalid'});
    const userAccount = await GDBUserAccountModel.findById(id);
    if (!userAccount)
      return res.status(400).json({success: false, message: 'No such user'});
    const {validated} = await validateCredentials(userAccount.email, currentPassword);
    if (!validated)
      return res.status(203).json({
        success: false,
        message: 'The current password is wrong.',
        wrongCurrentPassword: true
      });
    const {saved} = await updateUserPassword(userAccount.email, newPassword);
    if (!saved)
      return res.status(400).json({success: false, message: 'Cannot update password.'});
    return res.status(200).json({success: true, message: 'Successfully update password'});
  } catch (e) {
    next(e);
  }
};


const updateProfile = async (req, res) => {
  const {id} = req.params;
  const {gender, altEmail, address, countryCode, areaCode, phoneNumber, associatedOrganizations} = req.body;
  const userAccount = await GDBUserAccountModel.findOne({_id: id}, {populates: ['person.address', 'person.phoneNumber']});

  // remove the user from all previous associated organizations
  // if (userAccount.associatedOrganizations){
  //   for (let organizationURI of userAccount.associatedOrganizations){
  //     const organization = await GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]});
  //     organization.hasUsers
  //   }
  // }

  // add the user to all associated organizations

  // store current associated organizations


  const person = userAccount.person;
  if (gender && Validator.gender(gender))
    return res.status(400).json({success: false, message: 'Wrong value on gender'});
  if (altEmail && Validator.email(altEmail))
    return res.status(400).json({success: false, message: 'Wrong value on altEmail'});
  person.gender = gender;
  person.altEmail = altEmail.toLowerCase();
  const {
    unitNumber, streetNumber, streetName, city,
    postalCode, state, streetDirection, streetType
  } = address;
  if (Object.keys(address).length > 0) {
    if (postalCode && Validator.postalCode(postalCode))
      return res.status(400).json({success: false, message: Validator.postalCode(postalCode)});
    if (streetNumber && isNaN(streetNumber))
      return res.status(400).json({success: false, message: 'The street number must be a number'});
    person.address = {
      unitNumber, streetNumber, streetName, city,
      postalCode, state, streetDirection, streetType
    };
  }
  if (countryCode && areaCode && phoneNumber) {
    if (isNaN(countryCode) || isNaN(areaCode) || isNaN(phoneNumber))
      return res.status(400).json({success: false, message: 'Wrong Phone number format'});
    person.phoneNumber = {countryCode, areaCode, phoneNumber};
  }

  await userAccount.save();
  return res.status(200).json({success: true});

};

module.exports = {
  regularUserUpdateSecurityQuestions,
  fetchProfileHandler,
  updateProfileHandler,
  regularUserUpdatePassword
};