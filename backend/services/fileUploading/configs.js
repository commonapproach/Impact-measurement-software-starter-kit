const baseLevelConfig = {
  beginningObjects: {},
  organization: {
    'org:hasLegalName': {rejectFile:true, restriction: {one: true, type: 'string', mandatory: true}}
  },
  indicator: {
    'cids:hasName': {flag: true, restriction: {one: true, type: 'string', mandatory: false}},
    'cids:hasDescription': {restriction: {one: true, type:'string'}},
    'cids:forOutcome': {flag: true, possibleErrors: ['badReference', 'subjectDoesNotBelong'], restriction: {one:false, type: 'outcome'}, doubleDirection: true},
    'cids:forOrganization': {restriction: {one:true, type: 'organization'}, propertyNameInUtil: 'forOrganization', doubleDirection: {property: 'hasIndicators',}},
    'cids:hasCode': {restriction: {type: 'code'}}
  }
};

module.exports = {
  baseLevelConfig
};