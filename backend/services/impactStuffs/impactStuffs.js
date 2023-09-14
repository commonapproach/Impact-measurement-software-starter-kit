const {baseLevelConfig} = require("../fileUploading/configs");
const {Server400Error} = require("../../utils");
const {GDBCodeModel} = require("../../models/code");
const {GDBMeasureModel} = require("../../models/measure");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {getObjectValue} = require("../../helpers");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {assignValue} = require("../helpers");

async function impactNormsBuilder(environment, trans, object, organization, error, {impactNormsDict}, {
  addMessage,
  addTrace,
  transSave,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBImpactNormsModel
  const mainObject = environment === 'fileUploading' ? impactNormsDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, code);
    uri = code._uri;
  }


  const config = baseLevelConfig['impactNorms'];
  let hasError = false;
  let ret;
  if (mainObject) {

    if (organization || form.organization) {
      mainObject.organization = organization?._uri || form.organization;
    }
    if (!mainObject.organization && config["cids:forOrganization"]) {
      if (config["cids:forOrganization"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('For ImpactNorms, Organization is Mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'organization'))
          },
          config["cids:forOrganization"]
        );
    }

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'cids:hasDescription', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;


    if (environment === 'interface') {
      await transSave(trans, mainObject);
    }
    if (hasError) {
      // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
    } else if (environment === 'fileUploading') {
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }

  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

module.exports = {impactNormsBuilder};