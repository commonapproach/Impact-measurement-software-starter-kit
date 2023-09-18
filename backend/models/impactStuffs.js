const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBOrganizationModel} = require("./organization");
const {GDBStakeholderModel} = require("./stakeholder");
const {GDBOutcomeModel} = require("./outcome");
const {GDBIndicatorModel} = require("./indicator");
const {GDBIndicatorReportModel} = require("./indicatorReport");

const GDBImpactModelModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'},
  description: {type: String, internalKey: 'cids:hasName'},
  organization: {type: GDBOrganizationModel, internalKey: 'cids:forDescription'},
}, {
  rdfTypes: ['cids:ImpactModel'], name: 'impactModel'
});


const GDBImpactNormsModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'},
  description: {type: String, internalKey: 'cids:hasName'},
  organization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'},
  stakeholders: {type: [GDBStakeholderModel], internalKey: 'cids:hasStakeholder'},
  outcomes: {type: [GDBOutcomeModel], internalKey: 'cids:hasOutcome'},
  stakeholderOutcomes: {type: [require('./stakeholderOutcome').GDBStakeholderOutcomeModel], internalKey: 'cids:hasStakeholderOutcome'},
  indicators: {type: [GDBIndicatorModel], internalKey: 'cids:hasIndicatorReport'},
  impactReports: {type: [require('./impactReport').GDBImpactReportModel], internalKey: 'cids:hasImpactReport'},
  indicatorReports: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'}
}, {
  rdfTypes: ['cids:ImpactModel', "cids:ImpactNorms"], name: 'impactNorms'
});

module.exports = {
  GDBImpactModelModel,
  GDBImpactNormsModel
}
