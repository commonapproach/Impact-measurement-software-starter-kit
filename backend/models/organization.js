const {createGraphDBModel, Types, DeleteType} = require("graphdb-utils");
const {GDBUserAccountModel} = require("./userAccount");
const {GDBIndicatorModel} = require("./indicator");
const {GDBOutcomeModel} = require("./outcome");
const {GDBPhoneNumberModel} = require("./phoneNumber");

const GDBOrganizationIdModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey: 'tove_org:hasIdentifier'},
  issuedBy: {type: () => GDBOrganizationModel, internalKey: 'tove_org:issuedBy'},
  dateCreated: {type: Date, internalKey: 'schema:dateCreated'}
}, {
  rdfTypes: ['tove_org:OrganizationID'], name: 'organizationId'
});

const GDBOrganizationModel = createGraphDBModel({
  comment: {type: String, internalKey: 'rdfs:comment'},
  hasUsers: {type: [GDBUserAccountModel], internalKey: ':hasUser'},
  administrator: {type: GDBUserAccountModel, internalKey: ':hasAdministrator'},
  reporters: {type: [GDBUserAccountModel], internalKey: ':hasReporter'},
  editors: {type: [GDBUserAccountModel], internalKey: ':hasEditor'},
  researchers: {type: [GDBUserAccountModel], internalKey: ':hasResearcher'},
  legalName:{type: String, internalKey:'tove_org:hasLegalName'},
  hasId: {type: GDBOrganizationIdModel, internalKey: 'tove_org:hasID', onDelete: DeleteType.CASCADE}, // contains organization number
  hasIndicators: {type: [GDBIndicatorModel], internalKey: 'cids:hasIndicator'},
  hasOutcomes: {type: [GDBOutcomeModel], internalKey: 'cids:hasOutcome', onDelete: DeleteType.CASCADE},
  telephone: {type: GDBPhoneNumberModel, internalKey: 'ic:hasTelephone', onDelete: DeleteType.CASCADE},
  contactName: {type: String, internalKey: ':hasContactName'},
  email: {type: String, internalKey: ':hasEmail'},
}, {
  rdfTypes: ['cids:Organization'], name: 'organization'
});

const GDBStakeholderOrganizationModel = createGraphDBModel({
  description: {type: String, internalKey: 'schema:description'},
  catchmentArea: {type: String, internalKey: 'cids:hasCatchmentArea'},
  // charactoristic
  // name
},{
  rdfTypes: ['cids:Organization', 'cids:Stakeholder'], name: 'stakeholder'
})

module.exports = {
  GDBOrganizationModel, GDBOrganizationIdModel, GDBStakeholerModel
}