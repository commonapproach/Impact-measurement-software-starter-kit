const {createGraphDBModel, Types} = require("../utils/graphdb");
const {GDBUserAccountModel} = require("./userAccount");

const GDBOrganizationModel = createGraphDBModel({
  comment: {type: String, internalKey: 'rdfs:comment'},
  administrator: {type: GDBUserAccountModel, internalKey: ':hasAdministrator'},
  users:{type: [GDBUserAccountModel], internalKey:':hasUser'},
  legalName:{type: String, internalKey:'org:hasLegalName'}
}, {
  rdfTypes: ['cids:Organization'], name: 'organization'
});

module.exports = {
  GDBOrganizationModel
}