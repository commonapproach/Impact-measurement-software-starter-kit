const {createGraphDBModel, Types} = require("graphdb-utils");

const GDBInstant = createGraphDBModel({
  date: {type: Date, internalKey: 'time:inXSDDate'}
}, {
  rdfTypes: ['time:Instant'], name: 'timeInstant'
})

const GDBDateTimeIntervalModel = createGraphDBModel({
  hasBeginning: {type: GDBInstant, internalKey: 'time:hasBeginning'},
  hasEnd: {type: GDBInstant, internalKey: 'time:hasEnd'}

}, {
  rdfTypes: ['time:DateTimeInterval'], name: 'dateTimeInterval'
});


module.exports = {
  GDBDateTimeIntervalModel, GDBInstant
}