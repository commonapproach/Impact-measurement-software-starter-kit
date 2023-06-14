const {createGraphDBModel, Types} = require("graphdb-utils");

const GDBThemeModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'},
  description: {type: String, internalKey: 'cids:hasDescription'},
}, {
  rdfTypes: ['cids:Theme'], name: 'theme'
});

module.exports = {
  GDBThemeModel
}