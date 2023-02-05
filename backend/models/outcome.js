const {createGraphDBModel, Types} = require("../utils/graphdb");
const {GDBDomainModel} = require("./domain");

const GDBOutcomeModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  description: {type: String, internalKey: 'cids:hasDescription'},
  domain: {type: GDBDomainModel, internalKey: 'cids:forDomain'},
  forOrganization: {type: [Types.NamedIndividual], internalKey: 'cids:forOrganization'}
}, {
  rdfTypes: ['cids:Outcome'], name: 'outcome'
});

module.exports = {
  GDBOutcomeModel
}