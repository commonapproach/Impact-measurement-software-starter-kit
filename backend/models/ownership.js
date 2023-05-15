const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBUserAccountModel} = require("./userAccount");

const GDBOwnershipModel = createGraphDBModel({
  resource: {type: Types.NamedIndividual, internalKey: ':hasResource'},
  owner: {type: GDBUserAccountModel, internalKey: ':hasOwner'},
  dateOfCreation: {type: Date, internalKey: ':dateOfCreation'},
}, {
  rdfTypes: [':Ownership'], name: 'ownership'
});

module.exports = {
  GDBOwnershipModel
}