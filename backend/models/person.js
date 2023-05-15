const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBAddressModel} = require('./address')
const {GDBPhoneNumberModel} = require('./phoneNumber')

const GDBPersonModel = createGraphDBModel({
  familyName: {type: String, internalKey: 'foaf:familyName'},
  givenName: {type: String, internalKey: 'foaf:givenName'},
  middleName: {type: String, internalKey: 'foaf:middleName'},
  formalName: {type: String, internalKey: 'foaf:formalName'},
  address: {type: GDBAddressModel, internalKey: 'ic:hasAddress'},
  gender: {type: String, internalKey: 'cwrc:hasGender'},
  email: {type: String, internalKey: 'ic:hasEmail'},
  altEmail: {type: String, internalKey: 'ic:hasAltEmail'},
  phoneNumber: {type: GDBPhoneNumberModel, internalKey: 'ic:hasTelephone'},
}, {
  rdfTypes: ['cids:Person'], name: 'person'
});

module.exports = {
  GDBPersonModel
}