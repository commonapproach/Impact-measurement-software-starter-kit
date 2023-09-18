const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBThemeModel} = require("../../models/theme");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");
const {getRepository} = require("../../loaders/graphDB");
const {expand, frame} = require('jsonld');
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBUnitOfMeasure, GDBMeasureModel} = require("../../models/measure");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../../models/time");
const {isValidURL} = require("../../helpers/validator");
const {GraphDB} = require("graphdb-utils");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {outcomeBuilder} = require("../outcomes/outcomeBuilder");
const {transSave, getFullPropertyURI, getFullTypeURI, getValue, getObjectValue} = require("../helpers")
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {themeBuilder} = require("../theme/themeBuilder");
const {GDBCodeModel} = require("../../models/code");
const {codeBuilder} = require("../code/codeBuilder");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {characteristicBuilder} = require("../characteristic/characteristicBuilder");
const {indicatorReportBuilder} = require("../indicatorReport/indicatorReportBuilder");
const {indicatorBuilder} = require("../indicators/indicatorBuilder");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {GDBImpactReportModel} = require("../../models/impactReport");
const {stakeholderOutcomeBuilder} = require("../stakeholderOutcome/stakeholderOutcomeBuilder");
const {impactNormsBuilder} = require("../impactStuffs/impactStuffs");
const {impactReportBuilder} = require("../impactReport/impactReportBuilder");

const fileUploadingHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fileUploading'))
      return await fileUploading(req, res, next);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};




const getFullObjectURI = (object) => {
  return object["@id"];
};


const fileUploading = async (req, res, next) => {

  const repo = await getRepository();
  const trans = await repo.beginTransaction();
  trans.repositoryClientConfig.useGdbTokenAuthentication(repo.repositoryClientConfig.username, repo.repositoryClientConfig.pass);
  try {
    const objectDict = {};
    const outcomeDict = {};
    const themeDict = {};
    const codeDict = {};
    const characteristicDict = {};
    const indicatorDict = {};
    const indicatorReportDict = {};
    const impactReportDict = {};
    const stakeholderOutcomeDict = {};

    let messageBuffer = {
      begin: [], end: [], noURI: []
    };
    let traceOfUploading = '';
    let error = 0;

    function formatMessage() {
      let msg = '';
      messageBuffer.begin.map(sentence => {
        msg += sentence + '\n';
      });
      messageBuffer['noURI']?.map(sentence => {
        msg += sentence + '\n';
      });
      Object.keys(messageBuffer).map(uri => {
        if (uri !== 'begin' && uri !== 'end' && uri !== 'noURI') {
          messageBuffer[uri].map(sentence => {
            msg += sentence + '\n';
          });
        }
      });
      messageBuffer.end?.map(sentence => {
        msg += sentence + '\n';
      });
      return msg;
    }

    function addMessage(spaces, messageType,
                        {
                          uri,
                          fileName,
                          organizationUri,
                          type,
                          property,
                          hasName,
                          value,
                          referenceURI,
                          subjectURI,
                          error,
                          url
                        }, {rejectFile, ignoreInstance, flag}) {
      let whiteSpaces = '';
      if (spaces)
        [...Array(spaces).keys()].map(() => {
          whiteSpaces += ' ';
        });
      if (uri && !messageBuffer[uri]) {
        messageBuffer[uri] = [];
      }
      let title;
      if (rejectFile) {
        title = 'Error';
      } else if (flag) {
        title = 'Warning';
      } else if (ignoreInstance) {
        title = 'Object Ignored'
      }


      switch (messageType) {
        case 'startToProcess':
          messageBuffer['begin'].push(whiteSpaces + `Loading file ${fileName}...`);
          break;
        case 'fileNotAList':
          messageBuffer['begin'].push(whiteSpaces + title);
          messageBuffer['begin'].push(whiteSpaces + 'The file should contain a list (start with [ and end with ] ) of json objects.');
          messageBuffer['begin'].push(whiteSpaces + 'Please consult the JSON-LD reference at: https://json-ld.org/');
          break;
        case 'fileEmpty':
          messageBuffer['begin'].push(whiteSpaces + title);
          messageBuffer['begin'].push(whiteSpaces + 'The file is empty');
          messageBuffer['begin'].push(whiteSpaces + 'There is nothing to upload');
          break;
        case 'addingToOrganization':
          messageBuffer['begin'].push(whiteSpaces + 'Adding objects to organization with URI: ' + organizationUri);
          messageBuffer['begin'].push(whiteSpaces + '');
          break;
        case 'emptyExpandedObjects':
          messageBuffer['begin'].push(whiteSpaces + title);
          messageBuffer['begin'].push(whiteSpaces + '    Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. '
            + 'Some objects must have a @context');
          messageBuffer['begin'].push(whiteSpaces + '    Read more about JSON-LD  at: https://json-ld.org/');
          messageBuffer['begin'].push(whiteSpaces + '    Nothing was uploaded');
          break;
        case 'wrongOrganizationURI':
          messageBuffer['begin'].push(whiteSpaces + `${title}: Incorrect organization URI ${organizationUri}: No such Organization`);
          messageBuffer['begin'].push(whiteSpaces + '    The file failed to upload');
          break;
        case 'invalidURI':
          messageBuffer[uri].push(`\n`);
          messageBuffer[uri].push(whiteSpaces + `${title}: Invalid URI`);
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an invalid URI`);
          if (ignoreInstance)
            messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
          break;
        case 'duplicatedURIInFile':
          messageBuffer[uri].push(whiteSpaces + `${title}: Duplicated URI`);
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an URI already in another object in this file`);
          if (ignoreInstance)
            messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
          break;
        case 'duplicatedURIInDataBase':
          messageBuffer[uri].push(whiteSpaces + `${title}: Duplicated URI`);
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an URI already in another object in the sandbox`);
          if (ignoreInstance)
            messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
          break;
        case 'readingMessage':
          messageBuffer[uri].push(whiteSpaces + `Reading object with URI ${uri} of type ${type}...`);
          break;
        case 'propertyMissing':
          messageBuffer[uri].push(whiteSpaces + `${title}: Mandatory property missing`);
          messageBuffer[uri].push(whiteSpaces + `    In object${hasName ? ' ' + hasName : ''} with URI ${uri} of type ${type} property ${property} is missing`);
          if (ignoreInstance)
            messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
          break;
        case 'differentOrganization':
          messageBuffer['begin'].push(whiteSpaces + `${title}:`);
          messageBuffer['begin'].push(whiteSpaces + `    Organization in the file(URI: ${uri}) is different from the organization chosen in the interface(URI: ${organizationUri})`);
          break;
        case 'sameOrganization':
          messageBuffer['begin'].push(whiteSpaces + `${title}: organization object is ignored`);
          messageBuffer['begin'].push(whiteSpaces + `    Organization information can only be updated through the interface`);
          break;
        case 'unsupportedObject':
          messageBuffer['end'].push(whiteSpaces + `${title}!`);
          messageBuffer['end'].push(whiteSpaces + `    Object with URI ${uri} is being ignored: The object type is not supported`);
          break;
        case 'invalidValue':
          messageBuffer[uri].push(whiteSpaces + `${title}: Invalid URI`);
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} attribute ${property}  contains invalid value(s): ${value}`);
          break;
        case 'badReference':
          messageBuffer[uri].push(whiteSpaces + `${title}: bad reference`);
          messageBuffer[uri].push(whiteSpaces + `    ${type} ${referenceURI} appears neither in the file nor in the sandbox`);
          break;
        case 'subjectDoesNotBelong':
          messageBuffer[uri].push(whiteSpaces + `${title}:`);
          messageBuffer[uri].push(whiteSpaces + `    ${type} ${subjectURI} does not belong to this organization`);
          break;
        case 'finishedReading':
          messageBuffer[uri].push(whiteSpaces + `Finished reading ${uri} of type ${type}...`);
          break;
        case 'insertData':
          messageBuffer['end'].push(whiteSpaces + 'Start to insert data...');
          break;
        case 'completedLoading':
          messageBuffer['end'].push(whiteSpaces + `Completed loading ${fileName}`);
          break;
        case 'errorCounting':
          messageBuffer['end'].push(whiteSpaces + `${error} error(s) found`);
          messageBuffer['end'].push(`File failed to upload`);
          break;
        case 'invalidURL':
          messageBuffer['begin'].push(whiteSpaces + `${title}: Invalid URL in context: ` + url);
          messageBuffer['end'].push(`File failed to upload`);
          break;
        case 'noURI':
          messageBuffer['noURI'].push(whiteSpaces + `${title}: No URI`);
          messageBuffer['noURI'].push(whiteSpaces + `    One object${type ? ` with type ${type}` : ''} has no URI`);
          if (ignoreInstance)
            messageBuffer['noURI'].push(whiteSpaces + '    The object is ignored');
          break;
      }
    }

    /**
     * return list of object URI
     * @param object
     * @param graphdbModel
     * @param property
     * @returns {*}
     */
    const getListOfValue = (object, graphdbModel, property) => {
      const ret = object[getFullURI(graphdbModel.schema[property].internalKey)].map(obj => {
        if (isValidURL(obj['@value'])) {
          return obj['@value'];
        } else {
          error += 1;
          addTrace('        Error: Invalid URI');
          addTrace(`            In object with URI ${object['@id']} of type ${getPrefixedURI(object['@type'][0])} attribute ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, property))}  contains invalid value(s): ${obj['@value']}`);
          addMessage(8, 'invalidValue',
            {
              uri: object['@id'],
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, property)),
              value: obj['@value']
            });
        }

      });
      return ret.filter(uri => !!uri);
    };

    function addTrace(message) {
      console.log(message);
      traceOfUploading += message + '\n';
    }


    const {objects, organizationUri, fileName} = req.body;
    addTrace(`Loading file ${fileName}...`);
    addMessage(0, 'startToProcess', {fileName}, {});
    if (!Array.isArray(objects)) {
      // the object should be an array
      addTrace('Error');
      addTrace('The file should contain a list (start with [ and end with ] ) of json objects.');
      addTrace('Please consult the JSON-LD reference at: https://json-ld.org/');
      error += 1;
      addMessage(0, 'fileNotAList', {});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }
    if (!objects.length) {
      // the objects shouldn't be empty
      addTrace('Warning!');
      addTrace('The file is empty');
      addTrace('There is nothing to upload ');
      addMessage(0, 'fileEmpty', {});
      error += 1;
      const msg = formatMessage();
      throw new Server400Error(msg);
    }
    addTrace('    Adding objects to organization with URI: ' + organizationUri);
    addTrace('');
    addMessage(4, 'addingToOrganization', {organizationUri}, {});

    const expandedObjects = await expand(objects);

    if (!expandedObjects.length) {
      addTrace('        Warning!');
      // addTrace('Got an empty list from json-ld expanded function...');
      addTrace('            Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. ' +
        'Some objects must have a @context');
      addTrace('            Read more about JSON-LD  at: https://json-ld.org/');
      addTrace('            Nothing was uploaded');
      error += 1;
      addMessage(8, 'emptyExpandedObjects', {});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }


    const organization = await GDBOrganizationModel.findOne({_uri: organizationUri}, {populates: ['hasOutcomes']});
    const impactNorms = await GDBImpactNormsModel.findOne({organization: organizationUri}) || GDBImpactNormsModel({organization: organizationUri});

    if (!organization) {
      addTrace('        Error: Incorrect organization URI: No such Organization');
      addTrace('            The file failed to upload');
      addMessage(8, 'wrongOrganizationURI', {organizationUri});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }

    for (let object of expandedObjects) {
      // store the raw object into objectDict
      const uri = object['@id'];
      if (!uri) {
        // in the case there is no URI
        // error += 1;
        if (object['@type'].includes(getFullTypeURI(GDBOrganizationModel))) {
          addMessage(8, 'noURI',
            {type: object['@type'][0]}, {rejectFile: true});
          error += 1
        } else {
          addMessage(8, 'noURI',
            {type: object['@type'][0]}, {ignoreInstance: true});
        }
        continue;
      }
      if (!isValidURL(uri)) {
        // error += 1;
        addTrace('        Error: Invalid URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an invalid URI`);
        addMessage(8, 'invalidURI', {uri, type: getPrefixedURI(object['@type'][0])}, {ignoreInstance: true});
        continue;
      }
      if (objectDict[uri]) {
        // duplicated uri in the file
        // error += 1;
        addTrace('        Error: Duplicated URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an URI already in another object in this file`);
        addMessage(8, 'duplicatedURIInFile', {uri, type: getPrefixedURI(object['@type'][0])}, {ignoreInstance: true});
        continue;
      }
      if (await GraphDB.isURIExisted(uri) && !object['@type'].includes(getFullTypeURI(GDBOrganizationModel))) {
        // check whether the uri belongs to other objects
        // duplicated uri in database
        // error += 1;
        addTrace('        Error: Duplicated URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an URI already in another object in the sandbox`);
        addMessage(8, 'duplicatedURIInDataBase', {
          uri,
          type: getPrefixedURI(object['@type'][0])
        }, {ignoreInstance: true});
        continue;
      }

      objectDict[uri] = object;
      // assign the object an id and store them into specific dict
      let hasError = false;
      let hasName = null;
      if (object['@type'].includes(getFullTypeURI(GDBOutcomeModel))) { // todo: here don't have to be hardcoded
        outcomeDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        indicatorDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorReportModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage',
          {uri, type: getPrefixedURI(object['@type'][0])}, {});
        indicatorReportDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURI(GDBThemeModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        themeDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURI(GDBCodeModel))) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        codeDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURI(GDBCharacteristicModel))) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        characteristicDict[uri] = {_uri: uri};

      } else if (object['type'].includes(getFullTypeURI(GDBStakeholderOutcomeModel))) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        stakeholderOutcomeDict[uri] = {_uri: uri};
      } else if (object['type'].includes(getFullTypeURI(GDBImpactReportModel))) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        impactReportDict[uri] = {_uri: uri};
      } else if (object['@type'].includes(getFullTypeURI(GDBUnitOfMeasure))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])});

        if (!object[getFullPropertyURI(GDBUnitOfMeasure, 'label')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))} is missing`);
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))
            });
          error += 1;
          hasError = true;
        }
        if (!hasError) {
          const unitOfMeasure = GDBUnitOfMeasure({
            label: getValue(object, GDBUnitOfMeasure, 'label')
          }, {uri: uri});
          await transSave(trans, unitOfMeasure);
        }

      } else if (object['@type'].includes(getFullTypeURI(GDBMeasureModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])});

        if (!object[getFullPropertyURI(GDBMeasureModel, 'numericalValue')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} ${getPrefixedURI(getFullPropertyURI(GDBMeasureModel, 'numericalValue'))} is missing`);
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBMeasureModel, 'numericalValue'))
            });
          error += 1;
          hasError = true;
        }
        if (!hasError) {
          const measure = GDBMeasureModel({
            numericalValue: getValue(object, GDBMeasureModel, 'numericalValue')
          }, {uri: uri});
          await transSave(trans, measure);
        }

      } else if (object['@type'].includes(getFullTypeURI(GDBDateTimeIntervalModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])});

        // if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')] ||
        //   !object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')]) {
        //   addTrace('        Error: Mandatory property missing');
        //   addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} hasBeginning and hasEnd is mandatory`);
        //   error += 1;
        //   hasError = true;
        // }

        if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning'))} is missing`);
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning'))
            });
          error += 1;
          hasError = true;
        }

        if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd'))} is missing`);
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd'))
            });
          error += 1;
          hasError = true;
        }

        if (!hasError) {
          const dateTimeInterval = GDBDateTimeIntervalModel({
            hasBeginning: getValue(object, GDBDateTimeIntervalModel, 'hasBeginning') ||
              GDBInstant({
                date: new Date(getValue(object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0],
                  GDBInstant, 'date')
                )
              }),
            hasEnd: getValue(object, GDBDateTimeIntervalModel, 'hasEnd') ||
              GDBInstant({
                date: new Date(getValue(object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0],
                  GDBInstant, 'date')
                )
              })
          }, {uri: uri});
          await transSave(trans, dateTimeInterval);
        }

      } else if (object['@type'].includes(getFullTypeURI(GDBOrganizationModel))) {
        if (object['@id'] !== organizationUri) {
          addTrace('        Error:');
          addTrace('             Organization in the file is different from the organization chosen in the interface');
          addMessage(8, 'differentOrganization',
            {uri, organizationUri}, {rejectFile: true});
          // error += 1;

        } else {
          addTrace(`        Warning: organization object is ignored`);
          addTrace(`            Organization information can only be updated through the interface`);
          addMessage(8, 'sameOrganization', {uri}, {flag: true});
        }

      } else {
        addTrace('        Warning!');
        addTrace(`            Object with URI ${uri} is being ignored: The object type is not supported`);
        addMessage(8, 'unsupportedObject', {uri}, {flag: true});
      }
    }


    for (let [uri, object] of Object.entries(objectDict)) {
      if (object['@type'].includes(getFullTypeURI(GDBOutcomeModel))) {
        error = await outcomeBuilder('fileUploading', trans, object, organization,impactNorms, error, {objectDict, outcomeDict}, {addMessage, addTrace, transSave, getFullPropertyURI, getValue, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {
        error = await indicatorBuilder('fileUploading', trans, object, organization, impactNorms, error, {
          indicatorDict,
          objectDict
        }, {
          addMessage,
          addTrace,
          transSave,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorReportModel))) {
        error = await indicatorReportBuilder('fileUploading', trans, object, organization, impactNorms, error, {
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
        }, null);
      } else if (object['@type'].includes(getFullTypeURI(GDBThemeModel))) {
        error = await themeBuilder('fileUploading', trans, object, error, {themeDict}, {
          addMessage,
          addTrace,
          transSave,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURI(GDBCodeModel))) {
        error = await codeBuilder('fileUploading', trans, object,organization, error, {codeDict}, {
          addMessage,
          addTrace,
          transSave,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURI(GDBCharacteristicModel))) {
        error = await characteristicBuilder('fileUploading', trans, object, error, {characteristicDict}, {
          addMessage,
          addTrace,
          transSave,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURI(GDBStakeholderOutcomeModel))) {
        error = await stakeholderOutcomeBuilder('fileUploading', trans, object, organization, impactNorms, error, {stakeholderOutcomeDict, objectDict}, {
          addMessage,
          addTrace,
          transSave,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURI(GDBImpactReportModel))) {
        error = await impactReportBuilder('fileUploading', trans, object, organization, impactNorms, error, {impactReportDict}, {
          addMessage,
          addTrace,
          transSave,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      }
    }
    await transSave(trans, organization);
    await transSave(trans, impactNorms);
    // await organization.save();
    if (!error) {
      addTrace('    Start to insert data...');
      addMessage(4, 'insertData', {}, {});

      const indicators = Object.entries(indicatorDict).map(([uri, indicator]) => {
        return GDBIndicatorModel(
          indicator, {_uri: indicator._uri}
        );
      });

      await Promise.all(indicators.map(indicator => transSave(trans, indicator)));

      const codes = Object.entries(codeDict).map(([uri, code]) => {
        return GDBCodeModel(
          code, {_uri: code._uri}
        );
      })
      await Promise.all(codes.map(code => transSave(trans, code)));

      const characteristics = Object.entries(characteristicDict).map(([uri, characteristic]) => {
        return GDBCharacteristicModel(
          characteristic, {_uri: characteristic._uri}
        );
      })
      await Promise.all(characteristics.map(characteristic => transSave(trans, characteristic)));

      const outcomes = Object.entries(outcomeDict).map(([uri, outcome]) => {
        return GDBOutcomeModel(
          outcome, {_uri: outcome._uri}
        );
      });
      await Promise.all(outcomes.map(outcome => transSave(trans, outcome)));

      const indicatorReports = Object.entries(indicatorReportDict).map(([uri, indicatorReport]) => {
        return GDBIndicatorReportModel(
          indicatorReport, {_uri: indicatorReport._uri}
        );
      });
      await Promise.all(indicatorReports.map(indicatorReport => transSave(trans, indicatorReport)));

      const themes = Object.entries(themeDict).map(([uri, theme]) => {
        return GDBThemeModel(
          theme, {_uri: theme._uri}
        );
      });
      await Promise.all(themes.map(theme => transSave(trans, theme)));


      await trans.commit();
      addTrace(`Completed loading ${fileName}`);
      addMessage(0, 'completedLoading', {fileName}, {});
    } else {
      addTrace(`${error} error(s) found`);
      addTrace(`File failed to upload`);
      addMessage(0, 'errorCounting', {error}, {});
    }

    if (!error) {
      const msg = formatMessage();
      return res.status(200).json({success: true, traceOfUploading: msg});
    } else {
      const msg = formatMessage();
      await trans.rollback();
      throw new Server400Error(msg);
    }

  } catch (e) {
    if (trans.active)
      await trans.rollback();
    if (e.name === 'jsonld.InvalidUrl') {
      addMessage(4, 'invalidURL', {url: e.details.url});
      e.message = formatMessage();
    }
    next(e);
  }
};

module.exports = {fileUploadingHandler,};