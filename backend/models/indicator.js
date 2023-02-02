const {createGraphDBModel, Types} = require("../utils/graphdb");
const {GDBIndicatorReportModel} = require("./indicatorReport");

const GDBIndicatorModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  description: {type: String, internalKey: 'cids:hasDescription'},
  indicatorReport: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'},
  forOrganization: {type: [Types.NamedIndividual], internalKey: 'cids:forOrganization'}
}, {
  rdfTypes: ['cids:Indicator'], name: 'indicator'
});

module.exports = {
  GDBIndicatorModel
}