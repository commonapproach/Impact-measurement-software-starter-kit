const {baseLevelConfig} = require("../fileUploading/configs");
const {GDBImpactScaleModel, GDBImpactDepthModel} = require("../../models/howMuchImpact");
const {assignValue, getObjectValue} = require("../helpers");
const {GDBMeasureModel} = require("../../models/measure");
const {Server400Error} = require("../../utils");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function howMuchImpactBuilder(environment, subType,trans, object, organization, impactNorms, error, {
  impactScaleDict,
  impactDepthDict,
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
  const GDBDict = {impactScale: GDBImpactScaleModel, impactDepth: GDBImpactDepthModel}
  const mainModel = GDBDict[subType];
  const mainObject = environment === 'fileUploading' ? impactScaleDict[uri] : mainModel({}, {uri: form.uri});

  if (environment !== 'fileUploading') {
    await transSave(trans, mainObject);
    uri = mainObject._uri;
  }
  const config = baseLevelConfig['impactScale'];

  if (mainObject) {
    ret = assignValue(environment, config, object, mainModel, mainObject, 'indicator', 'cids:forIndicator', addMessage, form, uri, hasError, error);
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
          throw new Server400Error(`${subType} Iso21972 Value is Mandatory`);
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
    if (!ignore && !hasError && environment === 'fileUploading') {
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }

  }
  return error;

}