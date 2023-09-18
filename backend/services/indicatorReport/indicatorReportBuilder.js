const {baseLevelConfig} = require("../fileUploading/configs");
const {getFullPropertyURI, getValue, getObjectValue, transSave, assignValue, assignValues} = require("../helpers");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBMeasureModel} = require("../../models/measure");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {Server400Error} = require("../../utils");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function indicatorReportBuilder(environment, trans, object, organization, impactNorms, error, {
  indicatorDict,
  indicatorReportDict,
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
  let hasError = false;
  let ret;
  let ignore;
  const mainModel = GDBIndicatorReportModel;
  const mainObject = environment === 'fileUploading' ? indicatorReportDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, mainObject);
    uri = mainObject._uri;
  }
  const config = baseLevelConfig.indicatorReport;


  if (mainObject) {

    if (environment !== 'fileUploading') {
      organization = await GDBOrganizationModel.findOne({_uri: form.organization});
      impactNorms = await GDBImpactNormsModel.findOne({organization: form.organization}) || GDBImpactNormsModel({organization: form.organization});
    }

    mainObject.forOrganization = organization._uri;

    if (!impactNorms.indicatorReports)
      impactNorms.indicatorReports = [];
    impactNorms.indicatorReports.push(uri);

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'comment', 'cids:hasComment', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'value', 'iso21972:value', addMessage, form, uri, hasError, error, getListOfValue)
    error = ret.error;
    hasError = ret.hasError;

    // add indicator to the indicatorReport

    assignValue(environment, config, object, mainModel, mainObject, 'forIndicator', 'cids:forIndicator', addMessage, form, uri, hasError, error);

    // add the indicatorReport to indicator if needed
    if (environment === 'interface' || (!ignore && !indicatorDict[mainObject.forIndicator])) {
      // the indicator is not in the file, fetch it from the database and add the indicatorReport to it
      const indicatorURI = mainObject.forIndicator;
      const indicator = await GDBIndicatorModel.findOne({_uri: indicatorURI});
      if (!indicator) {
        if (environment === 'fileUploading'){
          addTrace('        Error: bad reference');
          addTrace(`            Indicator ${indicatorURI} appears neither in the file nor in the sandbox`);
          addMessage(8, 'badReference',
            {uri, referenceURI: indicatorURI, type: 'Indicator'}, {rejectFile: true});
          error += 1;
          hasError = true;
        } else if (environment === 'interface') {
          throw new Server400Error('No such Indicator');
        }
      } else if (!indicator.forOrganization !== organization._uri) {
        if (environment === 'fileUploading') {
          addTrace('        Error:');
          addTrace(`            Indicator ${indicatorURI} doesn't belong to this organization`);
          addMessage(8, 'subjectDoesNotBelong',
            {uri, type: 'Indicator', subjectURI: indicatorURI}, {rejectFile: true});
          error += 1;
          hasError = true;
        } else if (environment === 'interface'){
          throw new Server400Error('The indicator is not under the organization');
        }
      } else {
        if (!indicator.indicatorReports) {
          indicator.indicatorReports = [];
        }
        indicator.indicatorReports.push(uri);
        await transSave(trans, indicator);
      }
    }

    if (!ignore && !hasError && environment === 'fileUploading') {
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }
  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

module.exports = {indicatorReportBuilder}