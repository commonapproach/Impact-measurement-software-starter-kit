const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBIndicatorReportModel} = require("./indicatorReport");
const {GDBUnitOfMeasure} = require("./measure");
const {GDBOutcomeModel} = require("./outcome");

const GDBIndicatorModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'}, // todo: here is issue, on protege, it should be tov_org:hasName
  description: {type: String, internalKey: 'cids:hasDescription'},
  forOutcomes: {type: [GDBOutcomeModel], internalKey: 'cids:forOutcome'},
  indicatorReports: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'},
  forOrganizations: {type: [() => require('./organization').GDBOrganizationModel], internalKey: 'cids:forOrganization'},
  unitOfMeasure: {type: GDBUnitOfMeasure, internalKey: 'iso21972:unit_of_measure'},
}, {
  rdfTypes: ['cids:Indicator'], name: 'indicator'
});

module.exports = {
  GDBIndicatorModel, GDBUnitOfMeasure
}