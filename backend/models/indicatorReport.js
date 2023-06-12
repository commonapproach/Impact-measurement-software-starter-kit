const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBDateTimeIntervalModel} = require("./time");
const {GDBMeasureModel} = require("./measure");
const {GDBOwnershipModel} = require("./ownership");

const GDBIndicatorReportModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'},
  comment: {type: String, internalKey: 'cids:hasComment'},
  forOrganization: {type: Types.NamedIndividual, internalKey: 'cids:forOrganization'},
  forIndicator: {type: Types.NamedIndividual, internalKey: 'cids:forIndicator'},
  dateCreated: {type: Date, internalKey: 'schema:dateCreated'},
  hasTime: {type: GDBDateTimeIntervalModel, internalKey: 'time:hasTime'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
}, {
  rdfTypes: ['cids:IndicatorReport'], name: 'indicatorReport'
});

module.exports = {
  GDBIndicatorReportModel
}