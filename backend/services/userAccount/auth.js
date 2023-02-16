const {validateCredentials, findUserAccountById, findUserAccountByEmail} = require('./user');
const Hashing = require("../../utils/hashing");
const {userTypeURI2UserType} = require("../../helpers/dicts")
const {GDBUserAccountModel} = require("../../models/userAccount");

const login = async (req, res, next) => {
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
      req.session._id = userAccount._id;

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
  const id = req.session._id;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Please correctly input the email and password first before moving on.'
    });
  }
  try {
    const userAccount = await findUserAccountById(id);
    await userAccount.populate('securityQuestions');
    if (!userAccount) {
      return res.status(400).json({success: false, message: 'No such user'});
    }
    const securityQuestions = [userAccount.securityQuestions[0].question, userAccount.securityQuestions[1].question, userAccount.securityQuestions[2].question];
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
  const {question, answer} = req.body;

  const id = req.session._id;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Please correctly input the email and password first before moving on.'
    });
  }

  try {
    const userAccount = await GDBUserAccountModel.findById(id);
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
              _id: userAccount._id,
              isSuperuser: userAccount.isSuperuser,
              editorOf: userAccount.editorOfs,
              reporterOf: userAccount.reporterOfs,
              administratorOf: userAccount.administratorOfs,
              groupAdminOf: userAccount.groupAdminOfs,
              researcherOf: userAccount.researcherOfs,
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
  req.session.email = '';
  return res.json({success: true});
};

module.exports = {login, logout, getUserSecurityQuestions, checkUserSecurityQuestion, getSecurityQuestionsByEmail};
