const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBUserAccountModel} = require("./userAccount");

const GDBOwnershipModel = createGraphDBModel({
  resource: {type: Types.NamedIndividual, internalKey: ':hasResource'},
  owner: {type: GDBUserAccountModel, internalKey: ':hasOwner'},
  modifier: {type: GDBUserAccountModel, internalKey: ':hasModifier'},
  dateOfCreation: {type: Date, internalKey: ':dateOfCreation'},
  dateOfModified: {type: Date, internalKey: ':dateOfModified'},
}, {
  rdfTypes: [':Ownership'], name: 'ownership'
});

module.exports = {
  GDBOwnershipModel
}