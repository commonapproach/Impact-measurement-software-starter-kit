const {baseLevelConfig} = require("../fileUploading/configs");
const {Server400Error} = require("../../utils");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function characteristicBuilder(environment, trans, object, error, {characteristicDict}, {
  addMessage,
  addTrace,
  transSave,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBCharacteristicModel
  const characteristic = environment === 'fileUploading' ? characteristicDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, characteristic);
    uri = characteristic._uri;
  }


  const config = baseLevelConfig['characteristic'];
  let hasError = false;
  if (characteristic) {

    if ((object && object[getFullPropertyURI(mainModel, 'name')]) || form?.name) {
      characteristic.name = environment === 'fileUploading' ? getValue(object, mainModel, 'name') : form.name;
    }
    if (!characteristic.name && config["cids:hasName"]) {
      if (config["cids:hasName"].rejectFile) {
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
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'name'))
          },
          config["cids:hasName"]
        );

    }

    // codes
    if ((object && object[getFullPropertyURI(mainModel, 'codes')]) || form?.codes) {
      characteristic.codes = environment === 'fileUploading' ? getListOfValue(object, mainModel, 'codes') : form.codes;
    }

    if ((!characteristic.codes || !characteristic.codes.length) && config['cids:hasCode']) {
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
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'codes'))
          },
          config['cids:hasCode']
        );
    }

    // stakeholders
    if ((object && object[getFullPropertyURI(mainModel, 'stakeholders')]) || form?.stakeholders) {
      characteristic.stakeholders = environment === 'fileUploading' ? getListOfValue(object, mainModel, 'stakeholders') : form.stakeholders;
    }

    if ((!characteristic.stakeholders || !characteristic.stakeholders.length) && config['cids:forStakeholder']) {
      if (config['cids:forStakeholder'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Stakeholders are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'stakeholders'))
          },
          config['cids:forStakeholder']
        );
    }


    if ((object && object[getFullPropertyURI(mainModel, 'value')]) || form?.value) {
      characteristic.value = getValue(object, mainModel, 'value') || form.value;
    }
    if (!characteristic.value && config["iso21972:value"]) {
      if (config["iso21972:value"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Value is Mandatory');
        }

      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'value'))
          },
          config["iso21972:value"]
        );
    }


    if (environment === 'interface') {
      await transSave(trans, characteristic);
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

module.exports = {characteristicBuilder};