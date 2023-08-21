const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBUserAccountModel} = require("./userAccount");
const {GDBOrganizationModel} = require("./organization");
const {GDBMeasureModel} = require("./measure");

const GDBCodeModel = createGraphDBModel({
  definedBy: {type: GDBOrganizationModel, internalKey: 'cids:definedBy'},
  specification: {type: String, internalKey: 'cids:hasSpecification'},
  identifier: {type: String, internalKey: 'tove_org:hasIdentification'},
  name: {type: String, internalKey: 'cids:hasName'},
  description: {type: String, internalKey: 'schema:hasDescription'},
  codeValue: {type: String, internalKey: 'schema:codeValue'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'}
}, {
  rdfTypes: ['cids:Code'], name: 'code'
});

module.exports = {
  GDBCodeModel
}