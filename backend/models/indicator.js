const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBIndicatorReportModel} = require("./indicatorReport");
const {GDBOutcomeModel} = require("./outcome");
const {GDBCodeModel} = require("./code");

const GDBIndicatorModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'}, // todo: here is issue, on protege, it should be tov_org:hasName
  description: {type: String, internalKey: 'cids:hasDescription'},
  forOutcomes: {type: [GDBOutcomeModel], internalKey: 'cids:forOutcome'},
  indicatorReports: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'},
  forOrganization: {type: () => require('./organization').GDBOrganizationModel, internalKey: 'cids:definedBy'},
  unitOfMeasure: {type: () => require('./measure').GDBUnitOfMeasure, internalKey: 'iso21972:unit_of_measure'},
  codes: {type: [GDBCodeModel], internalKey: 'cids:hasCode'},
  baseline: {type: () => require('./measure').GDBMeasureModel, internalKey: 'cids:hasBaseline'}
}, {
  rdfTypes: ['cids:Indicator'], name: 'indicator'
});

module.exports = {
  GDBIndicatorModel,
}