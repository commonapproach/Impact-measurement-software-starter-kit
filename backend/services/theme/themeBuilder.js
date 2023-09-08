const {baseLevelConfig} = require("../fileUploading/configs");
const {GDBThemeModel} = require("../../models/theme");
const {Server400Error} = require("../../utils");
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
  const theme = environment === 'fileUploading' ? themeDict[uri] : GDBThemeModel({
    // name: form.name
  }, {uri: form.uri});
  if (environment === 'interface') {
    await transSave(trans, theme);
    uri = theme._uri;
  }
  const config = baseLevelConfig['theme'];

  if (theme) {

    if ((object && object[getFullPropertyURI(GDBThemeModel, 'name')]) || form?.name) {
      theme.name = environment === 'fileUploading' ? getValue(object, GDBThemeModel, 'name') : form.name;
    } else if (config['cids:hasName']) {
      if (config['cids:hasName'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Name is mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'name'))
          },
          config['cids:hasName']
        );
    }

    if ((object && object[getFullPropertyURI(GDBThemeModel, 'description')]) || form?.description) {
      theme.description = environment === 'fileUploading' ? getValue(object, GDBThemeModel, 'description') : form.description;
    } else if (config['cids:hasDescription']) {
      if (config['cids:hasDescription'].rejectFile) {
        if (environment === 'fileUploading') {
          hasError = true;
          error += 1;
        } else {
          throw new Server400Error('Description is mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'description'))
          },
          config['cids:hasDescription']
        );
    }

    // codes
    if ((object && object[getFullPropertyURI(GDBThemeModel, 'codes')]) || form?.codes) {
      theme.codes = environment === 'fileUploading' ? getListOfValue(object, GDBThemeModel, 'codes') : form.codes;
    }

    if ((!theme.codes || !theme.codes.length) && config['cids:hasCode']) {
      if (config['cids:hasCode'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Codes are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'codes'))
          },
          config['cids:hasCode']
        );
    }

    if (environment === 'interface') {
      await transSave(trans, theme)
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