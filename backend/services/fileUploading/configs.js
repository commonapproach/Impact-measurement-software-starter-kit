const baseLevelConfig = {
  beginningObjects: {},
  organization: {

  },
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
  }
};

module.exports = {
  baseLevelConfig
};