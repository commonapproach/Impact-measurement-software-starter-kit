const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBMeasureModel} = require("./measure");
const {GDBIndicatorModel} = require("./indicator");

const GDBHowMuchImpactModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
}, {
  rdfTypes: ['cids:HowMuchImpact'], name: 'howMuchImpact'
});

const GDBImpactScaleModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactScale'], name: 'impactScale'
});

const GDBImpactDepthModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactDepth'], name: 'impactDepth'
});


module.exports = {
  GDBHowMuchImpactModel, GDBImpactScaleModel, GDBImpactDepthModel
}