const {createGraphDBModel, Types} = require("../utils/graphdb");
const {GDBIndicatorReportModel} = require("./indicatorReport");

const GDBIndicatorModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  hasDescription: {type: String, internalKey: 'cids:hasDescription'},
  hasIndicatorReport: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'}
}, {
  rdfTypes: ['cids:Indicator'], name: 'indicator'
});

module.exports = {
  GDBIndicatorModel
}