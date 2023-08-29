const baseLevelConfig = {
  beginningObjects: {},
  organization: {
    'org:hasLegalName': {rejectFile:true, restriction: {one: true, type: 'string', mandatory: true}}
  },
  indicator: {
    'cids:hasName': {rejectFile: false, flag: true, restriction: {one: true, type: 'string', mandatory: false}, propertyNameInUtil: 'name'},
    'cids:hasDescription': {restriction: {one: true, type:'string'}, propertyNameInUtil: 'description'},
    'cids:forOutcome': {flag: true, possibleErrors: ['badReference', 'subjectDoesNotBelong'], restriction: {one:false, type: 'outcome'}, doubleDirection: {property: 'indicators'}, propertyNameInUtil: 'forOutcomes'},
    'cids:forOrganization': {restriction: {one:true, type: 'organization'}, propertyNameInUtil: 'forOrganization',
      // doubleDirection: {property: 'hasIndicators',}
    },
    'cids:hasCode': {restriction: {type: 'code'}, propertyNameInUtil: 'codes'}
  }
};

module.exports = {
  baseLevelConfig
};