const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBOrganizationModel} = require("./organization");
const {GDBStakeholderModel} = require("./stakeholder");
const {GDBOutcomeModel} = require("./outcome");
const {GDBIndicatorModel} = require("./indicator");
const {GDBIndicatorReportModel} = require("./indicatorReport");

const GDBImpactModelModel = createGraphDBModel({
  organization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'},
}, {
  rdfTypes: ['cids:ImpactModel'], name: 'impactModel'
});


const GDBImpactNormsModel = createGraphDBModel({
  organization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'},
  stakeholders: {type: [GDBStakeholderModel], internalKey: 'cids:hasStakeholder'},
  outcomes: {type: [GDBOutcomeModel], internalKey: 'cids:hasOutcome'},
  // stakeholderOutcome: {type: [], internalKey: 'cids:hasStakeholderOutcome'},
  indicators: {type: [GDBIndicatorModel], internalKey: 'cids:hasIndicatorReport'},
  // impactReports: {type: [], internalKey: 'cids:hasImpactReport'}
  indicatorReports: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'}
}, {
  rdfTypes: ['cids:ImpactModel', "cids:ImpactNorms"], name: 'impactNorms'
});

module.exports = {
  GDBImpactModelModel,
  GDBImpactNormsModel
}
