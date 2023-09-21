const baseLevelConfig = {

  theme: {},
  outcome: {
    'cids:hasIndicator': {flag: true},
  },
  indicator: {
    'cids:forOutcome': {flag: true},
    'cids:hasName': {flag: true}
  },
  indicatorReport: {
    'cids:hasName': {flag: true},
    'cids:forIndicator': {ignoreInstance: true},
    'iso21972:value': {flag: true}
  },
  stakeholderOutcome: {},
  characteristic: {},
  impactScale:{},
  impactDepth: {}
};

module.exports = {
  baseLevelConfig
};