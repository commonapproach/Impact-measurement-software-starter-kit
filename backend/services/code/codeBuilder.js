const {baseLevelConfig} = require("../fileUploading/configs");
const {Server400Error} = require("../../utils");
const {GDBCodeModel} = require("../../models/code");
const {GDBMeasureModel} = require("../../models/measure");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {Transaction} = require('graphdb-utils')
const {getObjectValue, assignValue, assignMeasure} = require("../helpers");

async function codeBuilder(environment, trans, object, organization, error, {codeDict}, {
  addMessage,
  addTrace,
  transSave,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBCodeModel;
  let ret;
  const mainObject = environment === 'fileUploading' ? codeDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await Transaction.beginTransaction();
    await mainObject.save();
    uri = mainObject._uri;
  }

  const config = baseLevelConfig['code'];
  let hasError = false;
  if (mainObject) {

    if (organization || form?.definedBy) {
      mainObject.definedBy = organization?._uri || form.definedBy;
    }
    if (!mainObject.definedBy && config["cids:definedBy"]) {
      if (config["cids:definedBy"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('DefinedBy is Mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'definedBy'))
          },
          config["cids:definedBy"]
        );
    }

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'cids:hasDescription', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'identifier', 'tove_org:hasIdentifier', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'specification', 'cids:hasSpecification', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'codeValue', 'schema:codeValue', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignMeasure(environment, config, object, mainModel, mainObject, 'iso72Value', 'iso21972:value', addMessage, uri, hasError, error, form);
    hasError = ret.hasError;
    error = ret.error;

    if (environment === 'interface') {
      await mainObject.save();
      await Transaction.commit();
      return true
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

module.exports = {codeBuilder};