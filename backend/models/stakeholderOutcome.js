const {createGraphDBModel} = require("graphdb-utils");
const {GDBCodeModel} = require("./code");

const GDBStakeholderOutcomeModel = createGraphDBModel({
  description: {type: String, internalKey: 'cids:hasDescription'},
  name: {type: String, internalKey: 'cids:hasName'},
  codes : {type: [GDBCodeModel], internalKey: 'cids:hasCode'},
  stakeholder: {type: () => require('stakeholder').GDBStakeholderModel, internalKey: 'cids:forStakeholder'},
  forOutcome: {type: () => require('outcome').GDBOutcomeModel, internalKey: 'cids:forOutcome'},
  importance: {type: String, internalKey: 'cids:hasImportance'},
  isUnderserved: {type: Boolean, internalKey: 'cids:isUndererved'},
  indicators: {type: [() => require('indicator').GDBIndicatorModel], internalKey: 'cids:hasIndicator'}
},{
  rdfTypes: ['cids:StakeholderOutcome'], name: 'stakeholderOutcome'
})

module.exports = {GDBStakeholderOutcomeModel}