const {validateCredentials, findUserAccountByEmail} = require('./user');
const Hashing = require("../../utils/hashing");
const {userTypeURI2UserType} = require("../../helpers/dicts")
const {GDBUserAccountModel, GDBSuperPasswordModel} = require("../../models/userAccount");

const loginSuperPassword = async (req, res, next) => {

  try {
    let {superPassword} = req.body;

    if (!superPassword) {
      return res.status(400).json({success: false, message: 'superPassword is required to login.'});
    }

    const sp = await GDBSuperPasswordModel.findOne({});
    if (!sp) {
      return res.status(400).json({success: false, message: 'superPassword is not in the database'});
    }

    if (!sp.hash || !sp.salt) {
      return res.status(400).json({success: false, message: 'invalid superPassword in the databse'});
    }

    const validated = await Hashing.validatePassword(superPassword, sp.hash, sp.salt);

    if (!validated) {
      return res.status(400).json({success: false, message: 'Super password is not correct.'});
    } else {
      req.session.superPassword = true;
      return res.json({
        success: true
      });
    }
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  if (!req.session.superPassword) {
    return res.status(400).json({success: false, message: 'Please input superPassword correctly first'});
  }
  let {email, password} = req.body;
  email = email.toLowerCase();

  if (!email || !password) {
    return res.status(400).json({success: false, message: 'Email and password are required to login.'});
  }

  try {
    const {validated, userAccount} = await validateCredentials(email, password);
    if (!validated) {
      return res.status(400).json({success: false, message: 'Username or password is incorrect.'});
    } else {
      req.session._uri = userAccount._uri;

      return res.json({
        success: true
      });
    }
  } catch (e) {
    next(e);
  }
};

const getSecurityQuestionsByEmail = async (req, res, next) => {
  try {
    const {email} = req.params;
    if (!email)
      return res.status(400).json({
        success: false, message: 'Email is required'
      });
    const userAccount = await GDBUserAccountModel.findOne({email: email.toLowerCase()}, {populates: ['securityQuestions']});
    if (!userAccount) {
      return res.status(400).json({success: false, message: 'No such user'});
    }
    const securityQuestions = [userAccount.securityQuestions[0].question, userAccount.securityQuestions[1].question, userAccount.securityQuestions[2].question];
    return res.status(200).json({
      success: true,
      message: 'Success',
      securityQuestions
    });

  } catch (e) {
    next(e);
  }
}

const getUserSecurityQuestions = async (req, res, next) => {
  if (!req.session.superPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please enter superPassword correctly before tring to login'
    });
  }
  const uri = req.session._uri;
  if (!uri) {
    return res.status(400).json({
      success: false,
      message: 'Please correctly input the email and password first before moving on.'
    });
  }
  try {
    const userAccount = await GDBUserAccountModel.findOne({_uri: uri});
    await userAccount.populate('securityQuestions');
    if (!userAccount) {
      return res.status(400).json({success: false, message: 'No such user'});
    }
    const securityQuestions = [
      userAccount.securityQuestions[0].question,
      userAccount.securityQuestions[1].question,
      userAccount.securityQuestions[2].question];
    return res.status(200).json({
      success: true,
      message: 'Success',
      data: {email: userAccount.primaryEmail, securityQuestions}
    });
  } catch (e) {
    next(e);
  }

};

const checkUserSecurityQuestion = async (req, res, next) => {
  try {
    const {question, answer} = req.body;
    if (!req.session._uri) {
      return res.status(400).json({
        success: false,
        message: 'Please correctly input the email and password first before moving on.'
      });
    }
    const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
    await userAccount.populate('securityQuestions', 'person');
    for (let i in userAccount.securityQuestions) {
      let securityQuestion = userAccount.securityQuestions[i];
      if (securityQuestion.question === question) {
        const match = await Hashing.validatePassword(answer, securityQuestion.hash, securityQuestion.salt);
        if (match) {
          req.session.email = userAccount.email;
          // req.session.userTypes =  userAccount.userTypes.map(usertypeURI => {
          //   return userTypeURI2UserType[usertypeURI]
          // })
          req.session.isSuperuser = userAccount.isSuperuser;
          req.session.editorOf = userAccount.editorOfs;
          req.session.reporterOf = userAccount.reporterOfs;
          req.session.administratorOf = userAccount.administratorOfs;
          req.session.groupAdminOf = userAccount.groupAdminOfs;
          req.session.researcherOf = userAccount.researcherOfs;
          req.session.associatedOrganizations = userAccount.associatedOrganizations;
          return res.status(200).json({success: true, matched: true, message: 'matched',
            userAccount: {
              person: userAccount.person,
              email: userAccount.email,
              _uri: userAccount._uri,
              isSuperuser: userAccount.isSuperuser,
              editorOfs: userAccount.editorOfs,
              reporterOfs: userAccount.reporterOfs,
              administratorOfs: userAccount.administratorOfs,
              groupAdminOfs: userAccount.groupAdminOfs,
              researcherOfs: userAccount.researcherOfs,
              associatedOrganizations: userAccount.associatedOrganizations,
            }});
        } else {
          return res.status(203).json({success: false, matched: false, message: 'incorrect'});
        }
      }
    }
    return res.status(400).json({success: false, message: 'No such question'});
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res) => {
  req.session.superPassword = false;
  req.session.email = '';
  return res.json({success: true});
};

module.exports = {login, logout, getUserSecurityQuestions, checkUserSecurityQuestion, getSecurityQuestionsByEmail, loginSuperPassword};
