const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBCodeModel} = require("./code");
const {GDBStakeholderModel} = require("./stakeholder");

const GDBCharacteristicModel = createGraphDBModel({
  codes: {type: [GDBCodeModel], internalKey: 'cids:hasCode'},
  stakeholder: {type: GDBStakeholderModel, internalKey: 'cids:forStakeholder'},
  name: {type: String, internalKey: 'cids:hasName'},
  value: {type: String, internalKey: 'iso21972:value'}
}, {
  rdfTypes: ['cids:Characteristic'], name: 'characteristic'
});

module.exports = {
  GDBCharacteristicModel
}