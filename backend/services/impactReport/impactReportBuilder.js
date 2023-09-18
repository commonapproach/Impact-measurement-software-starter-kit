const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBImpactReportModel} = require("../../models/impactReport");
const {baseLevelConfig} = require("../fileUploading/configs");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {assignValue} = require("../helpers");
const {Server400Error} = require("../../utils");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function impactReportBuilder(environment, trans, object, organization, impactNorms, error, {
  stakeholderOutcomeDict,
  impactReportDict,
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
  const mainModel = GDBImpactReportModel;
  const mainObject = environment === 'fileUploading' ? impactReportDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, mainObject);
    uri = mainObject._uri;
  }
  const config = baseLevelConfig.indicatorReport;

  if (mainObject) {
    if (environment !== 'fileUploading') {
      organization = await GDBOrganizationModel.findOne({_uri: form.organization});
      impactNorms = await GDBImpactNormsModel.findOne({organization: form.organization}) || GDBImpactNormsModel({organization: form.organization})
    }
    mainObject.forOrganization = organization._uri;
    if (!impactNorms.impactReports) {
      impactNorms.impactReports = [];
    }
    impactNorms.impactReports.push(uri);

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'comment', 'cids:hasComment', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'impactScale', 'cids:hasImpactScale', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'impactDepth', 'cids:hasImpactDepth', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'forStakeholderOutcome', 'cids:forOutcome', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    if (mainObject.forStakeholderOutcome) { // add the impactReport to stakeholderOutcome if needed
      if (environment === 'interface' || (!ignore && !stakeholderOutcomeDict[mainObject.forStakeholderOutcome])) {
        // the indicator is not in the file, fetch it from the database and add the indicatorReport to it
        const stakeholderOutcomeURI = mainObject.forStakeholderOutcome;
        const stakeholderOutcome = await GDBStakeholderOutcomeModel.findOne({_uri: stakeholderOutcomeDict});
        if (!stakeholderOutcome) {
          if (environment === 'fileUploading') {
            addTrace('        Error: bad reference');
            addTrace(`            StakeholderOutcome ${stakeholderOutcomeURI} appears neither in the file nor in the sandbox`);
            addMessage(8, 'badReference',
              {uri, referenceURI: stakeholderOutcomeURI, type: 'StakeholderOutcome'}, {rejectFile: true});
            error += 1;
            hasError = true;
          } else if (environment === 'interface') {
            throw new Server400Error('No such StakeholderOutcome');
          }
        } // todo: check weather the stakeholderOutcome and the impact report is for the same organization
        // else if (!indicator.forOrganization !== organization._uri) {
        //   if (environment === 'fileUploading') {
        //     addTrace('        Error:');
        //     addTrace(`            Indicator ${indicatorURI} doesn't belong to this organization`);
        //     addMessage(8, 'subjectDoesNotBelong',
        //       {uri, type: 'Indicator', subjectURI: indicatorURI}, {rejectFile: true});
        //     error += 1;
        //     hasError = true;
        //   } else if (environment === 'interface') {
        //     throw new Server400Error('The indicator is not under the organization');
        //   }
        // }
        else {
          if (!stakeholderOutcome.impactReports) {
            stakeholderOutcome.impactReports = [];
          }
          stakeholderOutcome.impactReports.push(uri);
          await transSave(trans, stakeholderOutcome);
        }
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

module.exports = {impactReportBuilder}