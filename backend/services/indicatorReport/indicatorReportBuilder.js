const {baseLevelConfig} = require("../fileUploading/configs");
const {getFullPropertyURI, getValue, getObjectValue, transSave, assignValue} = require("../helpers");
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


    let measureURI = getValue(object, mainModel, 'value');
    let measureObject = getObjectValue(object, mainModel, 'value');

    let value;
    if (measureObject)
      value = getValue(measureObject, GDBMeasureModel, 'numericalValue');

    if (!measureURI && !value && config['iso21972:value'] && !form.value) {
      if (config['iso21972:value'].rejectFile) {
        if (environment === 'interface') {
          throw new Server400Error('Indicator Report Iso21972 Value is Mandatory');
        } else if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'value'))
          },
          config['iso21972:value']
        );
    } else {
      mainObject.value = measureURI ||
        GDBMeasureModel({
            numericalValue: value
          },
          {uri: measureObject['@id']});
    }


    // add indicator to the indicatorReport

    mainObject.forIndicator = environment === 'fileUploading' ? getValue(object, GDBIndicatorReportModel, 'forIndicator') : form.forIndicator;
    if (!mainObject.forIndicator && config['cids:forIndicator']) {
      if (config['cids:forIndicator'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else if (environment === 'interface') {
          throw new Server400Error('For indicator is mandatory');
        }
      }
      if (config['cids:forIndicator'].ignoreInstance) {
        if (environment === 'fileUploading') {
          ignore = true;
          delete indicatorReportDict[uri];
        } else if (environment === 'interface') {
          throw new Server400Error('For indicator is mandatory');
        }
      }
      if (environment === 'fileUploading') {
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'forIndicator'))
          },
          config['cids:forIndicator']
        );
      }
    }

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