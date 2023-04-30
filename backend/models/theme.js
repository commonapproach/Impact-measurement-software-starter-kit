const {createGraphDBModel, Types} = require("../utils/graphdb");

const GDBThemeModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  description: {type: String, internalKey: 'cids:hasDescription'},
  // hasCode: {type: String, internalKey: 'cids:hasCode'},
  hasIdentifier: {type: String, internalKey: 'tove_org:hasIdentifier'}
}, {
  rdfTypes: ['cids:Theme'], name: 'theme'
});

module.exports = {
  GDBThemeModel
}