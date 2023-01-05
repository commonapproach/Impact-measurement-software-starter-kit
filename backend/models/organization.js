const {createGraphDBModel, Types, DeleteType} = require("../utils/graphdb");
const {GDBUserAccountModel} = require("./userAccount");
const {GDBIndicatorModel} = require("./indicator");
const {GDBOutcomeModel} = require("./outcome");

const GDBOrganizationIdModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey: 'tove_org:hasIdentifier'},
}, {
  rdfTypes: ['tove_org:OrganizationID'], name: 'organizationId'
});

const GDBOrganizationModel = createGraphDBModel({
  comment: {type: String, internalKey: 'rdfs:comment'},
  administrator: {type: GDBUserAccountModel, internalKey: ':hasAdministrator'},
  reporter: {type: [GDBUserAccountModel], internalKey: ':hasReporter'},
  editor: {type: [GDBUserAccountModel], internalKey: ':hasEditor'},
  researcher: {type: [GDBUserAccountModel], internalKey: ':hasResearcher'},
  legalName:{type: String, internalKey:'tove_org:hasLegalName'},
  hasId: {type: GDBOrganizationIdModel, internalKey: 'tove_org:hasID', onDelete: DeleteType.CASCADE},
  hasIndicator: {type: [GDBIndicatorModel], internalKey: 'cids:hasIndicator'},
  hasOutcome: {type: [GDBOutcomeModel], internalKey: 'cids:hasOutcome', onDelete: DeleteType.CASCADE}
}, {
  rdfTypes: ['cids:Organization'], name: 'organization'
});

module.exports = {
  GDBOrganizationModel, GDBOrganizationIdModel
}