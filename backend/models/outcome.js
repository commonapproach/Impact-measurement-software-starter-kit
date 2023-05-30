const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBThemeModel} = require("./theme");


const GDBOutcomeModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  description: {type: String, internalKey: 'cids:hasDescription'},
  theme: {type: GDBThemeModel, internalKey: 'cids:forTheme'},
  forOrganization: {type: Types.NamedIndividual, internalKey: 'cids:forOrganization'},
  indicators: {type:　[() => require("./indicator").GDBIndicatorModel], internalKey: 'cids:hasIndicator'},
}, {
  rdfTypes: ['cids:Outcome'], name: 'outcome'
});

module.exports = {
  GDBOutcomeModel
}