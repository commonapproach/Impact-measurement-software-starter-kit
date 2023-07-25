const {GDBOrganizationModel, GDBOrganizationIdModel} = require("../../models/organization");
const {Server400Error} = require("../../utils");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBThemeModel} = require("../../models/theme");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBPhoneNumberModel} = require("../../models/phoneNumber");

/**
 * Add organization to each account in organization[usertype] 's associated property
 * @param organization
 * @param usertype
 * @param property
 */
function addOrganizations2UsersRole(organization, usertype, property) {
  organization[usertype].map(reporter => {
    if (reporter) {
      if (!reporter[property])
        reporter[property] = [];
      reporter[property].push(organization);
    }
  });
}


async function createOrganization(req, res) {
  const {form} = req.body;
  if (!form)
    throw new Server400Error('Wrong information input');
  if (!form.legalName)
    throw new Server400Error('Legal name is requested');
  // if (!form.hasIdentifier)
  //   throw new Server400Error('Organization ID is requested');
  if (form.organizationNumber){
    form.hasId = GDBOrganizationIdModel({
      hasIdentifier: form.organizationNumber,
    });
  }
  if (form.issuedBy)
    form.hasId.issuedBy = form.issuedBy
  // handle administrators, editors, reporters, researchers

  // firstly replace ids to the actual userAccount object
  // then add organization id to the userAccount Object
  // form.administrator = await GDBUserAccountModel.findOne({_id: form.administrator});
  // if (!form.administrator)
  //   throw new Server400Error('Administrator: No such user');
  //
  // // firstly replace ids to the actual userAccount objects
  // form.reporters = await Promise.all(form.reporters.map(reporterId => {
  //   return GDBUserAccountModel.findOne({_id: reporterId});
  // }));
  // form.editors = await Promise.all(form.editors.map(editorId => {
  //   return GDBUserAccountModel.findOne({_id: editorId});
  // }));
  // form.researchers = await Promise.all(form.researchers.map(researcherId => {
  //   return GDBUserAccountModel.findOne({_id: researcherId});
  // }));


  let telephone;
  if(form.areaCode && form.countryCode && form.phoneNumber)
    telephone = GDBPhoneNumberModel({
    areaCode: form.areaCode,
    countryCode: form.countryCode,
    phoneNumber: form.phoneNumber,
  })
  const organization = GDBOrganizationModel({
    legalName: form.legalName,
    hasId: form.hasId,
    comment: form.comment,
    email: form.email,
    contactName: form.contactName,
    telephone: telephone
  }, form.uri?{uri:form.uri}:null);

  await organization.save();

  // then add organization id to the userAccount Object
  // if (!organization.administrator.administratorOfs)
  //   organization.administrator.administratorOfs = [];
  // organization.administrator.administratorOfs.push(organization);
  // addOrganizations2UsersRole(organization, 'reporters', 'reporterOfs');
  // addOrganizations2UsersRole(organization, 'editors', 'editorOfs');
  // addOrganizations2UsersRole(organization, 'researchers', 'researcherOfs');
  // await organization.save();

  return res.status(200).json({success: true, message: 'Successfully create organization ' + organization.legalName});
}

async function fetchOrganizationHandler(req, res, next) {
  try {
    if (await hasAccess(req, 'fetchOrganization')) {
      return await fetchOrganization(req, res);
    }

    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
}


async function createOrganizationHandler(req, res, next) {
  try {
    if (await hasAccess(req, 'createOrganization')) {
      return await createOrganization(req, res);
    } else {
      return res.status(400).json({message: 'Wrong Auth'});
    }
  } catch (e) {
    next(e);
  }
}

async function fetchOrganization(req, res) {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('Organization uri is needed');
  const organization = await GDBOrganizationModel.findOne({_uri: uri}, {populates: ['hasId.issuedBy', 'hasOutcomes', 'hasIndicators', 'telephone','administrator.person']});
  if (!organization)
    throw new Server400Error('No such organization');
  const outcomes = organization.hasOutcomes || [];
  // if (outcomes.length > 0) {
  //   outcomes.map(outcome => {
  //     outcome.theme = outcome.theme.split('_')[1];
  //   });
  // }
  const indicators = organization.hasIndicators || [];
  organization.organizationNumber = organization.hasId?.hasIdentifier;
  organization.issuedBy = organization.hasId?.issuedBy._uri;
  organization.issuedByName = organization.hasId?.issuedBy.legalName
  const administrator = organization.administrator
  organization.administrator = administrator._uri;
  organization.administratorName = administrator.person.givenName + ' ' + administrator.person.familyName
  if (!organization.researchers)
    organization.researchers = [];
  if (!organization.reporters)
    organization.reporters = [];
  if (!organization.editors)
    organization.editors = [];
  // if (organization.administrator)
  //   organization.administrator = organization.administrator;
  // organization.researchers = organization.researchers.map(researcher => researcher.split('_')[1]);
  // organization.editors = organization.editors.map(editor => editor.split('_')[1]);
  // organization.reporters = organization.reporters.map(reporter => reporter.split('_')[1]);
  delete organization.hasOutcomes;
  delete organization.hasId;
  delete organization.hasIndicators;
  return res.status(200).json({success: true, organization, outcomes, indicators});

}

// async function adminFetchOrganization(req, res, next) {
//   try {
//     const {id} = req.params;
//     const sessionId = req.session._id;
//     if (!id)
//       return res.status(400).json({success: false, message: 'Organization ID is needed'});
//     const organization = await GDBOrganizationModel.findOne({_id: id}, {populates: ['administrator', 'hasId', 'hasOutcomes']});
//     if (!organization)
//       return res.status(400).json({success: false, message: 'No such organization'});
//     if (organization.administrator._id !== sessionId)
//       return res.status(400).json({success: false, message: 'The user is not the admin of the organization'});
//     organization.administrator = `:userAccount_${organization.administrator._id}`;
//     const outcomes = organization.hasOutcomes || [];
//     if (outcomes.length > 0) {
//       outcomes.map(outcome => {
//         outcome.theme = outcome.theme.split('_')[1];
//       });
//     }
//     organization.ID = organization.hasId?.hasIdentifier;
//     delete organization.hasOutcomes;
//     delete organization.hasId;
//     return res.status(200).json({success: true, organization, outcomes});
//   } catch (e) {
//     next(e);
//   }
// }

async function updateOrganizationHandler(req, res, next) {
  try {
    if (await hasAccess(req, 'updateOrganization'))
      return await updateOrganization(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
}

function cacheUser(userAccount, userAccountDict) {
  if (!userAccountDict[userAccount._uri])
    userAccountDict[userAccount._uri] = userAccount;
}

function cacheListOfUsers(users, userAccountDict) {
  users.map(userAccount => {
    cacheUser(userAccount, userAccountDict);
  });
}

async function updateOrganization(req, res) {

  const {uri} = req.params;
  const {form} = req.body;
  const userAccountDict = {};
  if (!uri)
    throw new Server400Error('Id is needed');
  if (!form)
    throw new Server400Error('Form and outcomeForm are needed');
  if(!form.administrator)
    throw new Server400Error('Form must contain the administrator');

  const organization = await GDBOrganizationModel.findOne({_uri: uri},
    {populates: ['hasId', 'hasOutcomes', 'hasIndicators', 'administrator', 'reporters', 'researchers', 'editors', 'telephone']});

  if (!organization)
    throw new Server400Error('No such organization');
  if (!form.legalName)
    throw new Server400Error('Legal name is requested');
  // if (!form.hasIdentifier)
  //   throw Server400Error('ID is requested');

  // cache all userAccounts in the organization
  if (organization.administrator)
    cacheUser(organization.administrator, userAccountDict);

  if (organization.reporters)
    cacheListOfUsers(organization.reporters, userAccountDict);

  if (organization.editors)
    cacheListOfUsers(organization.editors, userAccountDict);

  if (organization.researchers)
    cacheListOfUsers(organization.researchers, userAccountDict);


  organization.legalName = form.legalName;
  organization.comment = form.comment;
  organization.contactName = form.contactName;
  organization.email = form.email;
  // organization.hasIdentifier = form.hasIdentifier;
  if (form.areaCode && form.countryCode && form.phoneNumber) {
    organization.telephone = {
      areaCode: form.areaCode,
      countryCode: form.countryCode,
      phoneNumber: form.phoneNumber
    }
  }



  if (userAccountDict[form.administrator]) {
    form.administrator = userAccountDict[form.administrator];
  } else {
    form.administrator = await GDBUserAccountModel.findOne({_uri: form.administrator});
    cacheUser(form.administrator, userAccountDict);
  }

  if (!form.administrator)
    throw Server400Error('Invalid administrator');

  // update organizationAdmin if needed
  if (organization.administrator?._uri !== form.administrator._uri) {
    if (!organization.administrator) {
      // then there is no organization administrator yet, add it
      organization.administrator = form.administrator;
      if(!organization.administrator.administratorOfs)
        organization.administrator.administratorOfs = [];
      organization.administrator.administratorOfs.push(organization);
    } else {
      // then the administrator have to be updated
      // delete organization from previous user's property
      const index = organization.administrator.administratorOfs.findIndex(org => org.split('_')[1] === id);
      organization.administrator.administratorOfs.splice(index, 1);
      await organization.administrator.save();
      // add organization on current user's property
      if (!form.administrator.administratorOfs)
        form.administrator.administratorOfs = [];
      form.administrator.administratorOfs.push(organization);
      // update property of organization
      organization.administrator = form.administrator;
    }

  }
  // organization.administrator = form.administrator;

  await Promise.all([
    updateRoles(organization, form, 'reporters', 'reporterOfs', userAccountDict),
    updateRoles(organization, form, 'researchers', 'researcherOfs', userAccountDict),
    updateRoles(organization, form, 'editors', 'editorOfs', userAccountDict)
  ]);
  if (form.organizationNumber && form.issuedBy) {
    if (!organization.hasId)
      organization.hasId = {}
    organization.hasId.issuedBy = form.issuedBy;
    organization.hasId.hasIdentifier = form.organizationNumber;
  }
  // organization.hasId.hasIdentifier = form.organizationNumber;
  // if(form.issuedBy)
  //   organization.hasId.issuedBy = `:organization_${form.issuedBy}`
  // if (organization.hasId.hasIdentifier !== form.ID) {
    // drop previous one
    // await GDBOrganizationIdModel.findOneAndDelete({_id: organization.hasId._id});
    // and add a new one
    // organization.hasId = GDBOrganizationIdModel({hasIdentifier: form.ID});
  // }

  // handle outcomes
  // await updateOutcomes(organization, outcomeForm);
  organization.markModified(['reporters', 'researchers', 'editors']);
  await organization.save();
  return res.status(200).json({
    success: true,
    message: 'Successfully updated organization ' + organization.legalName
  });

};


async function updateRoles(organization, form, organizationProperty, userAccountProperty, userAccountDict) {
  // for each reporter in organization, remove the organizations from its property
  if (!organization[organizationProperty])
    organization[organizationProperty] = [];
  await Promise.all(organization[organizationProperty].map(userAccount => {
    const index = userAccount[userAccountProperty].findIndex(org => org === organization._uri);
    userAccount[userAccountProperty].splice(index, 1);
    return userAccount.save();
  }));
  // add the organization to every new reporters' property
  if (form[organizationProperty].length > 0) {
    form[organizationProperty] = await Promise.all(form[organizationProperty].map(userAccountUri => {
        if (userAccountDict[userAccountUri]) {
          return userAccountDict[userAccountUri];
        } else {
          return GDBUserAccountModel.findOne({_uri: userAccountUri});
        }
      }
    ));
    cacheListOfUsers(form[organizationProperty], userAccountDict);
    await Promise.all(form[organizationProperty].map(userAccount => {
      if (!userAccount[userAccountProperty])
        userAccount[userAccountProperty] = [];
      userAccount[userAccountProperty].push(organization);
      // return userAccount.save();
    }));

  }
  organization[organizationProperty] = [...form[organizationProperty]];
}

/*
Check is theNewOutcome inside previous outcomes
if yes, update the previous outcome and return true
if no, return false
 */
async function includeThisNewOutcome(outcomes, theOutcome) {
  if (!theOutcome._id) // must be a new outcome
    return false;
  for (let outcome of outcomes) {
    if (!outcome._id) {
      throw new Server400Error('No _id in previous outcomes');
    }

    if (outcome._id === theOutcome._id) {
      outcome.name = theOutcome.name;
      outcome.description = theOutcome.description;
      if (outcome.theme.split('_')[1] !== theOutcome.theme) {
        console.log(outcome, theOutcome);
        const themeObject = await GDBThemeModel.findOne({_id: theOutcome.theme});
        if (!themeObject)
          throw new Server400Error('No such theme');
        console.log(themeObject);
        outcome.theme = themeObject;
      }
      return true;
    }

  }
  return false;
}

/*
Check is theOutcome inside new outcomes
return true if yes
 */
function includeThisPreviousOutcome(outcomes, theOutcome) {
  if (!theOutcome._id) {
    console.log(theOutcome);
    throw new Server400Error('The previous outcome does not have _id');
  }
  for (let newOutcome of outcomes) {
    if (newOutcome._id && newOutcome._id === theOutcome._id) {
      return true;
    }
  }
  return false;
};


const updateOutcomes = async (organization, outcomeForm) => {
  if (!organization.hasOutcomes)
    organization.hasOutcomes = [];
  // loop through previous outcomes, delete those not in the form
  for (let i = 0; i < organization.hasOutcomes.length; i++) {
    if (!includeThisPreviousOutcome(outcomeForm, organization.hasOutcomes[i])) {
      await GDBOutcomeModel.findOneAndDelete({_id: organization.hasOutcomes[i]._id});
      organization.hasOutcomes[i] = undefined;
    }
  }
  organization.hasOutcomes = organization.hasOutcomes.filter((outcome) => {
    return !!outcome;
  });
  // loop through new form,
  // add those not in previous outcomes to the form,
  // update those who were in previous outcomes
  const buf = [];
  for (let i = 0; i < outcomeForm.length; i++) {
    if (!await includeThisNewOutcome(organization.hasOutcomes, outcomeForm[i])) {
      // the new outcome is not in previous outcomes
      const theme = await GDBThemeModel.findOne({_id: outcomeForm[i].theme});
      if (!theme)
        return res.status(400).json({success: false, message: 'No such theme'});
      outcomeForm[i].theme = theme;
      buf.push(GDBOutcomeModel(outcomeForm[i]));
    }
  }
  organization.hasOutcomes = organization.hasOutcomes.concat(buf);
};

async function adminUpdateOrganization(req, res, next) {
  try {
    const {id} = req.params;
    const {form, outcomeForm} = req.body;

    const sessionId = req.session._id;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    if (!form)
      return res.status(400).json({success: false, message: 'Information is needed'});

    const organization = await GDBOrganizationModel.findOne({
      _id: id,
      administrator: {_id: sessionId}
    }, {populates: ['hasId', 'hasOutcomes']});
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});

    // admin shouldn't be able to edit legal name and administrator
    organization.comment = form.comment;
    organization.reporters = form.reporters;
    organization.editors = form.editors;
    organization.researchers = form.researchers;

    // handle outcomes
    await updateOutcomes(organization, outcomeForm);

    await organization.save();
    return res.status(200).json({
      success: true,
      message: 'Successfully updated organization ' + organization.legalName
    });

  } catch (e) {
    next(e);
  }
}

async function superuserDeleteOrganization(req, res, next) {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    const organization = await GDBOrganizationModel.findByIdAndDelete(id);
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});
    return res.status(200).json({success: true, message: 'Successfully deleted ' + organization.legalName});
  } catch (e) {
    next(e);
  }
}

module.exports = {
  updateOrganizationHandler,
  fetchOrganizationHandler,
  createOrganizationHandler
};