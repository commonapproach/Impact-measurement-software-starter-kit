const {Server400Error} = require("../utils");
const {GDBMeasureModel} = require("../models/measure");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {UpdateQueryPayload,} = require('graphdb').query;
const {QueryContentType} = require('graphdb').http;
/**
 * return the first URI belongs to the object[property]
 * @param object
 * @param graphdbModel
 * @param property
 * @returns {*}
 */
const getValue = (object, graphdbModel, property) => {
  if (object[getFullURI(graphdbModel.schema[property].internalKey)]) {
    return object[getFullURI(graphdbModel.schema[property].internalKey)][0]['@value'];
  } else {
    return undefined;
  }
};

const getObjectValue = (object, graphdbModel, property) => {
  if (object[getFullURI(graphdbModel.schema[property].internalKey)]) {
    return object[getFullURI(graphdbModel.schema[property].internalKey)][0];
  } else {
    return undefined;
  }
};

const getFullTypeURI = (graphdbModel) => {
  return getFullURI(graphdbModel.schemaOptions.rdfTypes[1]);
};

const getFullPropertyURI = (graphdbModel, propertyName) => {
  return getFullURI(graphdbModel.schema[propertyName].internalKey);
};

async function transSave(trans, object) {
  const {query} = await object.getQueries();
  return await trans.update(new UpdateQueryPayload()
    .setQuery(query)
    .setContentType(QueryContentType.SPARQL_UPDATE)
    // .setResponseType(RDFMimeType.RDF_XML)
    // .setInference(true)
    .setTimeout(5));
}


function assignValue(environment, config, object, mainModel, mainObject, propertyName, internalKey, addMessage, form, uri, hasError, error){
  if ((object && object[getFullPropertyURI(mainModel, propertyName)]) || form && form[propertyName]) {
    mainObject[propertyName] = environment === 'fileUploading' ? getValue(object, mainModel, propertyName) : form[propertyName];
  }
  if (!mainObject[propertyName] && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else if (environment === 'interface') {
        throw new Server400Error(`${propertyName} is mandatory`);
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  }
  return {hasError, error}
}

function assignValues(environment, config, object, mainModel, mainObject, propertyName, internalKey, addMessage, form, uri, hasError, error, getListOfValue){
  if ((object && object[getFullPropertyURI(mainModel, propertyName)]) || form && form[propertyName]) {
    mainObject[propertyName] = environment === 'fileUploading' ? getListOfValue(object, mainModel, propertyName) : form[propertyName];
  }
  if ((!mainObject[propertyName] || !mainObject[propertyName].length) && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else if (environment === 'interface') {
        throw new Server400Error(`${propertyName} is mandatory`);
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  }
  return {hasError, error}
}

function assignMeasure(environment, config, object, mainModel, mainObject, propertyName, internalKey, addMessage, uri, hasError, error, form) {
  let measureURI = getValue(object, mainModel, propertyName);
  let measureObject = getObjectValue(object, mainModel, propertyName);

  let numericalValue;
  if (measureObject)
    numericalValue = getValue(measureObject, GDBMeasureModel, 'numericalValue');

  if (!measureURI && !numericalValue && config[internalKey] && !form[propertyName]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'interface') {
        throw new Server400Error(`${propertyName} is Mandatory`);
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
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  } else if (measureURI || numericalValue){
    mainObject[propertyName] = measureURI ||
      GDBMeasureModel({
          numericalValue
        },
        {uri: measureObject? measureObject['@id'] : null});
  }
  return {hasError, error}
}


module.exports = {transSave, getFullPropertyURI, getFullTypeURI, getValue, getObjectValue, assignValue, assignValues, assignMeasure}