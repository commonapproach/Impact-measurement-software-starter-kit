const {GDBUserAccountModel} = require("../../models/userAccount");
const {genderOptions} = require("../../helpers/dicts");
const {Validator} = require("../../helpers/validator");
const {SPARQL} = require('../../utils/graphdb/helpers');

const regularUserGetProfile = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    const userAccount = await GDBUserAccountModel.findOne({_id: id}, {populates: ['person.phoneNumber', 'person.address']});
    if (!userAccount)
      return res.status(400).json({success: false, message: 'No such user'});
    if (!userAccount.person)
      return res.status(400).json({success: false});
    delete userAccount.person.email
    userAccount.person.address.streetDirection = SPARQL.getFullURI(userAccount.person.address.streetDirection)
    userAccount.person.address.streetType = SPARQL.getFullURI(userAccount.person.address.streetType)
    userAccount.person.address.state = SPARQL.getFullURI(userAccount.person.address.state)

    return res.status(200).json({success: true, person: userAccount.person});

  } catch (e) {
    next(e);
  }
};

const regularUserUpdateProfile = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {gender, altEmail, address, countryCode, areaCode, phoneNumber} = req.body;
    const userAccount = await GDBUserAccountModel.findOne({_id: id}, {populates: ['person.address', 'person.phoneNumber']});
    const person = userAccount.person;
    if(gender && Validator.gender(gender))
      return res.status(400).json({success: false, message: 'Wrong value on gender'})
    if(altEmail && Validator.email(altEmail))
      return res.status(400).json({success: false, message: 'Wrong value on altEmail'})
    person.gender = gender;
    person.altEmail = altEmail.toLowerCase();
    const {unitNumber, streetNumber, streetName, city,
    postalCode, state, streetDirection, streetType} = address
    if(postalCode && Validator.postalCode(postalCode))
      return res.status(400).json({success: false, message: Validator.postalCode(postalCode)});
    if(streetNumber && isNaN(streetNumber))
      return res.status(400).json({success: false, message: 'The street number must be a number'});
    person.address = {
      unitNumber, streetNumber, streetName, city,
      postalCode, state, streetDirection, streetType
    }
    if(countryCode && areaCode && phoneNumber){
      if(isNaN(countryCode) || isNaN(areaCode) || isNaN(phoneNumber))
        return res.status(400).json({success: false, message: 'Wrong Phone number format'})
      person.phoneNumber = {countryCode, areaCode, phoneNumber}
    }

    await userAccount.save();
    return res.status(200).json({success: true})



  } catch (e) {
    next(e);
  }
}

module.exports = {regularUserGetProfile, regularUserUpdateProfile};