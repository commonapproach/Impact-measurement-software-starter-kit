const {baseLevelConfig} = require("../fileUploading/configs");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {Server400Error} = require("../../utils");
const {GDBMeasureModel} = require("../../models/measure");
const {getObjectValue, assignMeasure, assignValue, assignValues} = require("../helpers");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function indicatorBuilder(environment, trans, object, organization, impactNorms, error, {
  indicatorDict,
  objectDict
}, {
                                  addMessage,
                                  addTrace,
                                  transSave,
                                  getFullPropertyURI,
                                  getValue,
                                  getListOfValue
                                }, form) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBIndicatorModel;
  let hasError = false;
  let ret;
  const mainObject = environment === 'fileUploading' ? indicatorDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, mainObject);
    uri = mainObject._uri;
  }

  const config = baseLevelConfig['indicator'];
  if (mainObject) {
    // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);

    // add the organization to it, and add it to the organization
    if (environment !== 'fileUploading') {
      organization = await GDBOrganizationModel.findOne({_uri: form.organization});
      impactNorms = await GDBImpactNormsModel.findOne({organization: form.organization}) || GDBImpactNormsModel({organization: form.organization});
    }

    mainObject.forOrganization = organization._uri;
    if (!impactNorms.indicators)
      impactNorms.indicators = [];
    impactNorms.indicators.push(uri);

    if (!organization.hasIndicators)
      organization.hasIndicators = [];
    organization.hasIndicators.push(uri);

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'tove_org:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'cids:hasDescription', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignMeasure(environment, config, object, mainModel, mainObject, 'baseline', 'cids:hasBaseline', addMessage, uri, hasError, error, form);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'codes', 'cids:hasCode', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;


    // add outcomes
    if (((environment === 'fileUploading' && !object[getFullPropertyURI(mainModel, 'forOutcomes')]) ||
      (environment === 'interface' && (!form.outcomes || !form.outcomes.length)) && config['cids:forOutcome'])
    ) {
      if (config['cids:forOutcome'].rejectFile) {
        if (environment === 'fileUploading') {
          hasError = true;
          error += 1;
        } else {
          throw new Server400Error('outcomes are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'forOutcomes'))
          },
          config['cids:forOutcome']
        );
    } else if ((object && object[getFullPropertyURI(mainModel, 'forOutcomes')]) || form.outcomes) {
      if (!mainObject.forOutcomes)
        mainObject.forOutcomes = [];
      for (const outcomeURI of environment === 'fileUploading'? getListOfValue(object, mainModel, 'forOutcomes') : form.outcomes) {
        mainObject.forOutcomes.push(outcomeURI);
        if (environment === 'interface' || !objectDict[outcomeURI]) {
          // in this case, the outcome is not in the file, get the outcome from database and add indicator to it
          const outcome = await GDBOutcomeModel.findOne({_uri: outcomeURI});
          if (!outcome) {
            if (environment === 'fileUploading') {
              addTrace('        Error: bad reference');
              addTrace(`            Outcome ${outcomeURI} appears neither in the file nor in the sandbox`);
              addMessage(8, 'badReference',
                {uri, referenceURI: outcomeURI, type: 'Outcome'}, {rejectFile: true});
              error += 1;
              hasError = true;
            } else if (environment === 'interface'){
              throw new Server400Error(`The outcome ${outcomeURI} does not exist`);
            }
          } else if (outcome.forOrganization !== organization._uri) {
            // check if the outcome belongs to the organization
            if (environment === 'fileUploading') {
              addTrace('        Error:');
              addTrace(`            Outcome ${outcomeURI} doesn't belong to this organization`);
              addMessage(8, 'subjectDoesNotBelong',
                {uri, type: 'Outcome', subjectURI: outcomeURI}, {rejectFile: true});
              error += 1;
              hasError = true
            } else if (environment === 'interface'){
              throw new Server400Error(`The outcome ${outcomeURI} does not belong to the organization`);
            }
          } else {
            if (!outcome.indicators)
              outcome.indicators = [];
            outcome.indicators.push(uri);
            await transSave(trans, outcome);
          }

        } // if the outcome is in the file or the environment is 'interface', don't have to worry about adding the indicator to the outcome
      }
    }

    // add indicator report, in this case, indicator reports will not be in the form
    if (environment !== 'interface') {
      if (object[getFullPropertyURI(mainModel, 'indicatorReports')]) {
        if (!mainObject.indicatorReports)
          mainObject.indicatorReports = [];
        getListOfValue(object, mainModel, 'indicatorReports').map(indicatorReportURI => {
          mainObject.indicatorReports.push(indicatorReportURI);
        });
      } else if (config['cids:hasIndicatorReport']) {
        if (config['cids:hasIndicatorReport'].rejectFile) {
          error += 1;
          hasError = true;
        }
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'indicatorReports'))
          },
          config['cids:hasIndicatorReport']
        );
      }
    }
    if (hasError) {
      // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
    } else if (environment === 'fileUploading'){
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }
  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

module.exports = {indicatorBuilder};