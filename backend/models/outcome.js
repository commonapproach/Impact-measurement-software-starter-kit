const {createGraphDBModel, Types} = require("graphdb-utils");


const GDBOutcomeModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'}, // todo: here is issue, on protege, it should be tov_org:hasName
  description: {type: String, internalKey: 'cids:hasDescription'},
  themes: {type: [() => require("./theme").GDBThemeModel], internalKey: 'cids:forTheme'},
  stakeholderOutcomes: {type: [() => require("./stakeholderOutcome").GDBStakeholderOutcomeModel], internalKey: 'cids:hasStakeholderOutcome'},
  forOrganization: {type: () => require("./organization").GDBOrganizationModel, internalKey: 'cids:forOrganization'},
  indicators: {type:　[() => require("./indicator").GDBIndicatorModel], internalKey: 'cids:hasIndicator'},
  codes: {type: [() => require('./code').GDBCodeModel], internalKey: 'cids:hasCode'}
}, {
  rdfTypes: ['cids:Outcome'], name: 'outcome'
});

module.exports = {
  GDBOutcomeModel
}