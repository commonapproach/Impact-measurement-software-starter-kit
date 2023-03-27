const {createGraphDBModel, Types, DeleteType} = require("../utils/graphdb");
const {GDBUserAccountModel} = require("./userAccount");
const {GDBIndicatorModel} = require("./indicator");
const {GDBOutcomeModel} = require("./outcome");
const {GDBPhoneNumberModel} = require("./phoneNumber");

const GDBOrganizationIdModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey: 'tove_org:hasIdentifier'},
  issuedBy: {type: Types.NamedIndividual, internalKey: 'tove_org:issuedBy'}
}, {
  rdfTypes: ['tove_org:OrganizationID'], name: 'organizationId'
});

const GDBOrganizationModel = createGraphDBModel({
  comment: {type: String, internalKey: 'rdfs:comment'},
  hasUser: {type: [GDBUserAccountModel], internalKey: ':hasUser'},
  administrator: {type: GDBUserAccountModel, internalKey: ':hasAdministrator'},
  reporter: {type: [GDBUserAccountModel], internalKey: ':hasReporter'},
  editor: {type: [GDBUserAccountModel], internalKey: ':hasEditor'},
  researcher: {type: [GDBUserAccountModel], internalKey: ':hasResearcher'},
  legalName:{type: String, internalKey:'tove_org:hasLegalName'},
  hasId: {type: GDBOrganizationIdModel, internalKey: 'tove_org:hasID', onDelete: DeleteType.CASCADE},
  hasIndicator: {type: [GDBIndicatorModel], internalKey: 'cids:hasIndicator'},
  hasOutcome: {type: [GDBOutcomeModel], internalKey: 'cids:hasOutcome', onDelete: DeleteType.CASCADE},
  telephone: {type: GDBPhoneNumberModel, internalKey: 'ic:hasTelephone', onDelete: DeleteType.CASCADE},
  contactName: {type: String, internalKey: ':hasContactName'},
  email: {type: String, internalKey: ':hasEmail'}
}, {
  rdfTypes: ['cids:Organization'], name: 'organization'
});

module.exports = {
  GDBOrganizationModel, GDBOrganizationIdModel
}