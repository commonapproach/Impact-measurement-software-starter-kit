const {GraphDB, Types, createGraphDBModel, DeleteType} = require('../utils/graphdb');

const {GDBPersonModel} = require('./person');
const {GDBOrganizationModel} = require("./organization");

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
  person:{type: GDBPersonModel, internalKey: 'cids:Person'},
  userType:{type: Types.NamedIndividual, internalKey: ':UserTypes'},
  organization:{type: [GDBOrganizationModel], internalKey: 'org:forOrganization'},
  // Exact 3 questions, the answer should be case-insensitive.
  securityQuestion: {type: [GDBSecurityQuestion], internalKey: ':hasSecurityQuestion'}

}, {
  rdfTypes: [':User'], name: 'userAccount'
});

module.exports = {GDBUserAccountModel,
  GDBSecurityQuestion
};
