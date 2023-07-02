const {GraphDB, Types, createGraphDBModel, DeleteType} = require('graphdb-utils');

const {GDBPersonModel} = require('./person');

const GDBSecurityQuestion = createGraphDBModel({
  question: {type: String, internalKey: ':hasQuestion'},
  // The answer should be case-insensitive.
  // The answer should be hashed
  hash: {type: String, internalKey: ':hasHash'},
  salt: {type: String, internalKey: ':hasSalt'},
}, {rdfTypes: [':SecurityQuestion'], name: 'securityQuestion'});


const GDBUserAccountModel = createGraphDBModel({
  email: {type: String, internalKey: ':hasEmail'},
  hash: {type: String, internalKey: ':hasHash'},
  salt: {type: String, internalKey: ':hasSalt'},
  person: {type: GDBPersonModel, internalKey: 'cids:forPerson', onDelete: DeleteType.CASCADE},
  // userType:{type: [Types.NamedIndividual], internalKey: ':userType'},
  associatedOrganizations: {type: [() => require('./organization').GDBOrganizationModel], internalKey: ':associatedOrganization'},
  isSuperuser: {type: Boolean, internalKey: ':isSuperuser'},
  editorOfs: {type: [Types.NamedIndividual], internalKey: ':editorOf'},
  reporterOfs: {type: [Types.NamedIndividual], internalKey: ':reporterOf'},
  administratorOfs: {type: [Types.NamedIndividual], internalKey: ':administratorOf'},
  groupAdminOfs: {type: [Types.NamedIndividual], internalKey: ':groupAdministratorOf'},
  researcherOfs: {type: [Types.NamedIndividual], internalKey: ':researcherOf'},
  // Exact 3 questions, the answer should be case-insensitive.
  securityQuestions: {type: [GDBSecurityQuestion], internalKey: ':hasSecurityQuestion', onDelete: DeleteType.CASCADE}

}, {
  rdfTypes: [':User'], name: 'userAccount'
});

module.exports = {GDBUserAccountModel,
  GDBSecurityQuestion
};
