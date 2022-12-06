const {GDBUserAccountModel} = require("../../models/userAccount");
const {genderOptions} = require("../../helpers/dicts");
const {Validator} = require("../../helpers/validator");
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

const regularUserUpdateProfile = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {gender, altEmail, address, countryCode, areaCode, phoneNumber} = req.body;
    const userAccount = await GDBUserAccountModel.findOne({_id: id}, {populates: ['person']});
    const person = userAccount.person;
    if(gender && !Validator.gender(gender))
      return res.status(400).json({success: false, message: 'Wrong value on gender'})
    if(altEmail && !Validator.email(altEmail))
      return res.status(400).json({success: false, message: 'Wrong value on altEmail'})
    person.gender = gender;
    person.altEmail = altEmail.toLowerCase();


  } catch (e) {

  }
}

module.exports = {regularUserGetProfile, regularUserUpdateProfile};