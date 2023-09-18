const {baseLevelConfig} = require("../fileUploading/configs");
const {GDBThemeModel} = require("../../models/theme");
const {Server400Error} = require("../../utils");
const {assignValue, assignValues} = require("../helpers");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function themeBuilder(environment, trans, object, error, {themeDict}, {
  addMessage,
  addTrace,
  transSave,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object ? object['@id'] : undefined;
  let hasError = false;
  const mainModel = GDBThemeModel;
  let ret;
  const mainObject = environment === 'fileUploading' ? themeDict[uri] : mainModel({
    // name: form.name
  }, {uri: form.uri});
  if (environment === 'interface') {
    await transSave(trans, mainObject);
    uri = mainObject._uri;
  }
  const config = baseLevelConfig['theme'];

  if (mainObject) {

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'cids:hasDescription', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'codes', 'cids:hasCode', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;


    if (environment === 'interface') {
      await transSave(trans, mainObject)
    }


    if (!hasError) {
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }
  }
  return error

}


module.exports = {themeBuilder}