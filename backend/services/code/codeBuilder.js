const {baseLevelConfig} = require("../fileUploading/configs");
const {Server400Error} = require("../../utils");
const {GDBCodeModel} = require("../../models/code");
const {GDBMeasureModel} = require("../../models/measure");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function codeBuilder(environment, trans, object, organization, error, {codeDict}, {
  addMessage,
  addTrace,
  transSave,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBCodeModel
  const code = environment === 'fileUploading' ? codeDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, code);
    uri = code._uri;
  }


  const config = baseLevelConfig['code'];
  let hasError = false;
  if (code) {

    if (organization || form?.definedBy) {
      code.definedBy = organization?._uri || form.definedBy;
    }
    if (!code.definedBy && config["cids:definedBy"]) {
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

    if ((object && object[getFullPropertyURI(mainModel, 'name')]) || form?.name) {
      code.name = environment === 'fileUploading' ? getValue(object, mainModel, 'name') : form.name;
    }
    if (!code.name && config["cids:hasName"]) {
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

    if ((object && object[getFullPropertyURI(mainModel, 'description')]) || form?.description) {
      code.description = getValue(object, mainModel, 'description') || form.description;
    }
    if (!code.description && config["cids:hasDescription"]) {
      if (config["cids:hasDescription"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Description is Mandatory');
        }

      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'description'))
          },
          config["cids:hasDescription"]
        );

    }

    if ((object && object[getFullPropertyURI(mainModel, 'identifier')]) || form?.identifier) {
      code.identifier = getValue(object, mainModel, 'identifier') || form.identifier;
    }
    if (!code.identifier && config["org:hasIdentifier"]) {
      if (config["org:hasIdentifier"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Description is Mandatory');
        }

      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'identifier'))
          },
          config["org:hasIdentifier"]
        );
    }

    if ((object && object[getFullPropertyURI(mainModel, 'specification')]) || form?.specification) {
      code.specification = getValue(object, mainModel, 'specification') || form.specification;
    }
    if (!code.specification && config["cids:hasSpecification"]) {
      if (config["cids:hasSpecification"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Description is Mandatory');
        }

      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'specification'))
          },
          config["cids:hasSpecification"]
        );
    }

    // code value
    if ((object && object[getFullPropertyURI(mainModel, 'codeValue')]) || form?.codeValue) {
      code.codeValue = getValue(object, mainModel, 'codeValue') || form.codeValue;
    }
    if (!code.codeValue && config["schema:codeValue"]) {
      if (config["schema:codeValue"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Code Value is Mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'codeValue'))
          },
          config["schema:codeValue"]
        );
    }


    let measureURI = getValue(object, mainModel, 'iso72Value');
    let measureObject = getObjectValue(object, mainModel, 'iso72Value');

    let iso72Value;
    if (measureObject)
      iso72Value = getValue(measureObject, GDBMeasureModel, 'numericalValue');

    if (!measureURI && !iso72Value && config['iso21972:value'] && !form.iso72Value) {
      if (config['iso21972:value'].rejectFile) {
        if (environment === 'interface') {
          throw new Server400Error('Code Iso21972 Value is Mandatory');
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
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'iso72Value'))
          },
          config['iso21972:value']
        );
    } else {
      code[iso72Value] = measureURI ||
        GDBMeasureModel({
            numericalValue: iso72Value
          },
          {uri: measureObject['@id']});
    }

    if (environment === 'interface') {
      await transSave(trans, code);
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