const {createGraphDBModel, Types} = require("../utils/graphdb");

const GDBUnitOfMeasure = createGraphDBModel({
  label: {type: String, internalKey: 'rdfs:label'},
}, {
  rdfTypes: ['iso21972:Unit_of_measure'], name: 'unit_of_measure'
})

const GDBMeasureModel = createGraphDBModel({
  numericalValue: {type: String, internalKey: 'iso21972:numerical_value'},
  unitOfMeasure: {type: GDBUnitOfMeasure, internalKey: 'iso21972:unit_of_measure'}
}, {
  rdfTypes: ['iso21972:Measure'], name: 'measure'
});

module.exports = {
  GDBMeasureModel
}