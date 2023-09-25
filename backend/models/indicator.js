const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBIndicatorReportModel} = require("./indicatorReport");
const {GDBOutcomeModel} = require("./outcome");
const {GDBMeasureModel} = require("./measure");

const GDBIndicatorModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'}, // todo: here is issue, on protege, it should be tov_org:hasName
  description: {type: String, internalKey: 'cids:hasDescription'},
  forOutcomes: {type: [GDBOutcomeModel], internalKey: 'cids:forOutcome'},
  indicatorReports: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'},
  forOrganization: {type: () => require('./organization').GDBOrganizationModel, internalKey: 'cids:definedBy'},
  unitOfMeasure: {type: () => require('./measure').GDBUnitOfMeasure, internalKey: 'iso21972:unit_of_measure'},
  codes: {type: [() => require('./code').GDBCodeModel], internalKey: 'cids:hasCode'},
  baseline: {type: GDBMeasureModel, internalKey: 'cids:hasBaseline'}
}, {
  rdfTypes: ['cids:Indicator'], name: 'indicator'
});

module.exports = {
  GDBIndicatorModel,
}