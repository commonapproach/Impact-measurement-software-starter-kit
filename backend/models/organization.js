const {createGraphDBModel, Types} = require("../utils/graphdb");
const {GDBUserAccountModel} = require("./userAccount");

const GDBOrganizationModel = createGraphDBModel({
  comment: {type: String, internalKey: 'rdfs:comment'},
  administrator: {type: GDBUserAccountModel, internalKey: ':hasAdministrator'},
  reporter: {type: [GDBUserAccountModel], internalKey: ':hasReporter'},
  editor: {type: [GDBUserAccountModel], internalKey: ':hasEditor'},
  researcher: {type: [GDBUserAccountModel], internalKey: ':hasResearcher'},
  legalName:{type: String, internalKey:'tove_org:hasLegalName'}
}, {
  rdfTypes: ['cids:Organization'], name: 'organization'
});

module.exports = {
  GDBOrganizationModel
}