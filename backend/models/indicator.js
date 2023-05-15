const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBIndicatorReportModel} = require("./indicatorReport");
const {GDBUnitOfMeasure} = require("./measure");
const {GDBOutcomeModel} = require("./outcome");

const GDBIndicatorModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  description: {type: String, internalKey: 'cids:hasDescription'},
  forOutcome: {type: [GDBOutcomeModel], internalKey: 'cids:forOutcome'},
  indicatorReport: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'},
  forOrganization: {type: [Types.NamedIndividual], internalKey: 'cids:forOrganization'},
  unitOfMeasure: {type: GDBUnitOfMeasure, internalKey: 'iso21972:hasUnit'},
  hasIdentifier: {type: String, internalKey: 'tove_org:hasIdentifier'}
}, {
  rdfTypes: ['cids:Indicator'], name: 'indicator'
});

module.exports = {
  GDBIndicatorModel
}