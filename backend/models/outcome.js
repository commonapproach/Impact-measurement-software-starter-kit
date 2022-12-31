const {createGraphDBModel, Types} = require("../utils/graphdb");
const {GDBDomainModel} = require("./domain");

const GDBOutcomeModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  hasDescription: {type: String, internalKey: 'cids:hasDescription'},
  forDomain: {type: GDBDomainModel, internalKey: 'cids:forDomain'}
}, {
  rdfTypes: ['cids:Outcome'], name: 'outcome'
});

module.exports = {
  GDBOutcomeModel
}