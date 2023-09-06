const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBThemeModel} = require("../../models/theme");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");
const {getRepository} = require("../../loaders/graphDB");
const {UpdateQueryPayload,} = require('graphdb').query;
const {QueryContentType} = require('graphdb').http;
const {expand, frame} = require('jsonld');
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBUnitOfMeasure, GDBMeasureModel} = require("../../models/measure");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../../models/time");
const {isValidURL} = require("../../helpers/validator");
const {GraphDB} = require("graphdb-utils");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {baseLevelConfig} = require('./configs');
const {config} = require("dotenv");
const {outcomeBuilder} = require("./outcomeBuilder");

const fileUploadingHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fileUploading'))
      return await fileUploading(req, res, next);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

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

const getFullObjectURI = (object) => {
  return object["@id"];
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

const fileUploading = async (req, res, next) => {

  const repo = await getRepository();
  const trans = await repo.beginTransaction();
  trans.repositoryClientConfig.useGdbTokenAuthentication(repo.repositoryClientConfig.username, repo.repositoryClientConfig.pass);
  try {
    const objectDict = {};
    const outcomeDict = {};
    const themeDict = {};
    const indicatorDict = {};
    const indicatorReportDict = {};
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


    async function themeBuilder(trans, object, organization) {
      const uri = object['@id'];
      const theme = themeDict[uri];
      const config = baseLevelConfig['theme'];
      if (theme) {

        if (object[getFullPropertyURI(GDBThemeModel, 'name')]) {
          theme.name = getValue(object, GDBThemeModel, 'name');
        } else if (config['cids:hasName']) {
          if (config['cids:hasName'].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'name'))
            },
            config['cids:hasName']
          );
        }

        if (object[getFullPropertyURI(GDBThemeModel, 'description')]) {
          theme.description = getValue(object, GDBThemeModel, 'description');
        } else if (config['cids:hasDescription']) {
          if (config['cids:hasDescription'].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'description'))
            },
            config['cids:hasDescription']
          );
        }

        addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'finishedReading',
          {uri, type: getPrefixedURI(object['@type'][0])}, {});
      }

    }

    async function indicatorBuilder(trans, object, organization) {
      const uri = object['@id'];
      let hasError = false;
      const indicator = indicatorDict[uri];
      const config = baseLevelConfig['indicator'];
      if (indicator) {
        // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);

        // add the organization to it, and add it to the organization
        indicator.forOrganization = organization._uri;
        if (!organization.hasIndicators)
          organization.hasIndicators = [];
        organization.hasIndicators.push(indicator._uri);

        if (object[getFullPropertyURI(GDBIndicatorModel, 'name')]) {
          indicator.name = getValue(object, GDBIndicatorModel, 'name');
        }
        if (!indicator.name && config["cids:hasName"]) {
          if (config["cids:hasName"].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'name'))
            },
            config["cids:hasName"]
          );
        }

        if (object[getFullPropertyURI(GDBIndicatorModel, 'description')]) {
          indicator.description = getValue(object, GDBIndicatorModel, 'description');
        }
        if (!indicator.description && config["cids:hasDescription"]) {
          if (config["cids:hasDescription"].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'description'))
            },
            config["cids:hasDescription"]
          );
        }

        // add outcomes
        if (object[getFullPropertyURI(GDBIndicatorModel, 'forOutcomes')]) {
          if (!indicator.forOutcomes) {
            indicator.forOutcomes = [];
          }
          for (const outcomeURI of getListOfValue(object, GDBIndicatorModel, 'forOutcomes')) {
            indicator.forOutcomes.push(outcomeURI);

            if (!objectDict[outcomeURI]) {
              //in this case, the outcome is not in the file, get the outcome from database and add indicator to it
              const outcome = await GDBOutcomeModel.findOne({_uri: outcomeURI});
              if (!outcome) {
                addTrace('        Error: bad reference');
                addTrace(`            Outcome ${outcomeURI} appears neither in the file nor in the sandbox`);
                addMessage(8, 'badReference',
                  {uri, referenceURI: outcomeURI, type: 'Outcome'}, {rejectFile: true});
                error += 1;
              } else if (outcome.forOrganization !== organization._uri) {
                // check if the outcome belongs to the organization
                addTrace('        Error:');
                addTrace(`            Outcome ${outcomeURI} doesn't belong to this organization`);
                addMessage(8, 'subjectDoesNotBelong',
                  {uri, type: 'Outcome', subjectURI: outcomeURI}, {rejectFile: true});
                error += 1;
              } else {
                if (!outcome.indicators)
                  outcome.indicators = [];
                outcome.indicators.push(uri);
                await transSave(trans, outcome);
              }

            } // if the outcome is in the file, don't have to worry about adding the indicator to the outcome
          }
        } else if (config['cids:forOutcome']) {
          if (config['cids:forOutcome'].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'forOutcomes'))
            },
            config['cids:forOutcome']
          );
        }

        // add indicator report
        if (object[getFullPropertyURI(GDBIndicatorModel, 'indicatorReports')]) {
          if (!indicator.indicatorReports)
            indicator.indicatorReports = [];
          getListOfValue(object, GDBIndicatorModel, 'indicatorReports').map(indicatorReportURI => {
            indicator.indicatorReports.push(indicatorReportURI);
          });
        } else if (config['cids:hasIndicatorReport']) {
          if (config['cids:hasIndicatorReport'].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'indicatorReports'))
            },
            config['cids:hasIndicatorReport']
          );
        }
        if (hasError) {
          // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
        } else {
          addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
          addMessage(4, 'finishedReading',
            {uri, type: getPrefixedURI(object['@type'][0])}, {});
        }
      } else {
        // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
      }

    }

    async function indicatorReportBuilder(trans, object, organization) {
      const uri = object['@id'];
      let ignore = false;
      const indicatorReport = indicatorReportDict[uri];
      const config = baseLevelConfig.indicatorReport;


      if (indicatorReport) {
        indicatorReport.forOrganization = organization._uri;


        if (object[getFullPropertyURI(GDBIndicatorReportModel, 'name')]) {
          indicatorReport.name = getValue(object, GDBIndicatorReportModel, 'name');
        } else if (config['cids:hasName']) {
          if (config['cids:hasName'].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'name'))
            },
            config['cids:hasName']
          );
        }

        if (object[getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated')]) {
          indicatorReport.dateCreated = new Date(getValue(object, GDBIndicatorReportModel, 'dateCreated'));
        } else if (config['sch:dateCreated']) {
          if (config['sch:dateCreated'].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated'))
            },
            config['sch:dateCreated']
          );
        }

        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'comment')]) {
          indicatorReport.comment = getValue(object, GDBIndicatorReportModel, 'comment');
        } else {
          if (config['cids:hasComment'].rejectFile)
            error += 1;
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'comment'))
            },
            config['cids:hasComment']
          );
        }

        let measureURI = getValue(object, GDBIndicatorReportModel, 'value');
        let measureObject = getObjectValue(object, GDBIndicatorReportModel, 'value');

        let numericalValue;
        if (measureObject)
          numericalValue = getValue(measureObject, GDBMeasureModel, 'numericalValue');

        if (!measureURI && !numericalValue && config['iso21972:value']) {
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'value'))
            },
            config['iso21972:value']
          );
          if (config['iso21972:value'].rejectFile)
            error += 1;
        } else {
          indicatorReport.value = measureURI ||
            GDBMeasureModel({
                numericalValue
              },
              {uri: measureObject['@id']});
        }


        // add indicator to the indicatorReport

        indicatorReport.forIndicator = getValue(object, GDBIndicatorReportModel, 'forIndicator');
        if (!indicatorReport.forIndicator && config['cids:forIndicator']) {
          if (config['cids:forIndicator'].rejectFile)
            error += 1;
          if (config['cids:forIndicator'].ignoreInstance) {
            ignore = true;
            delete indicatorReportDict[uri];
          }
          addMessage(8, 'propertyMissing',
            {
              uri,
              type: getPrefixedURI(object['@type'][0]),
              property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'forIndicator'))
            },
            config['cids:forIndicator']
          );
        }

        // add the indicatorReport to indicator if needed
        if (!ignore && !indicatorDict[indicatorReport.forIndicator]) {
          // the indicator is not in the file, fetch it from the database and add the indicatorReport to it
          const indicatorURI = indicatorReport.forIndicator;
          const indicator = await GDBIndicatorModel.findOne({_uri: indicatorReport.forIndicator});
          if (!indicator) {
            addTrace('        Error: bad reference');
            addTrace(`            Indicator ${indicatorURI} appears neither in the file nor in the sandbox`);
            addMessage(8, 'badReference',
              {uri, referenceURI: indicatorURI, type: 'Indicator'}, {rejectFile: true});
            error += 1;
          } else if (!indicator.forOrganization !== organization._uri) {
            addTrace('        Error:');
            addTrace(`            Indicator ${indicatorURI} doesn't belong to this organization`);
            addMessage(8, 'subjectDoesNotBelong',
              {uri, type: 'Indicator', subjectURI: indicatorURI}, {rejectFile: true});
            error += 1;
          } else {
            if (!indicator.indicatorReports) {
              indicator.indicatorReports = [];
            }
            indicator.indicatorReports.push(uri);
            await transSave(trans, indicator);
          }

        }

        if (!ignore) {
          addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
          addMessage(4, 'finishedReading',
            {uri, type: getPrefixedURI(object['@type'][0])}, {});
        }
      } else {
        // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
      }

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

        // if (!object[getFullPropertyURI(GDBOutcomeModel, 'name')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'name'))} is missing`);
        //   // addMessage(8, 'propertyMissing', {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'name'))})
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   hasName = getValue(object, GDBOutcomeModel, 'name');
        // }
        // let description;
        // if (!object[getFullPropertyURI(GDBOutcomeModel, 'description')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'description'))} is missing`);
        //   // addMessage(8, 'propertyMissing',
        //   //   {uri, type: getPrefixedURI(object['@type'][0]),hasName, property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'description'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   description = getValue(object, GDBOutcomeModel, 'description');
        // }
        // if (!hasError) {
        //   const outcome = GDBOutcomeModel({
        //     name: hasName,
        //     description: description,
        //     forOrganization: organization._uri
        //   }, {uri: uri});
        //   await transSave(trans, outcome);
        //   // outcomeDict[uri] = outcome;
        // }
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        indicatorDict[uri] = {_uri: uri};
        // if (!object[getFullPropertyURI(GDBIndicatorModel, 'name')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'name'))} is missing`);
        //   // addMessage(8, 'propertyMissing', {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'name'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   hasName = getValue(object, GDBIndicatorModel, 'name');
        // }

        // let description;
        // if (!object[getFullPropertyURI(GDBIndicatorModel, 'description')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'description'))} is missing`);
        //   // addMessage(8, 'propertyMissing',
        //   //   {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'description'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   description = getValue(object, GDBIndicatorModel, 'description')
        // }

        // let unitOfMeasure;
        // if (!object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure'))} is missing`);
        //   // addMessage(8, 'propertyMissing',
        //   //   {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   unitOfMeasure = getValue(object, GDBIndicatorModel, 'unitOfMeasure') ||
        //   GDBUnitOfMeasure({
        //       label: getValue(object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')][0],
        //         GDBUnitOfMeasure, 'label'
        //       )
        //     },
        //     {uri: getFullObjectURI(object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')][0])})
        // }

        // if there is error on building up indicator
        // if (!hasError) {
        //   const indicator = GDBIndicatorModel({
        //     name: hasName,
        //     description,
        //     unitOfMeasure,
        //     forOrganization: organization._uri
        //   }, {uri: uri});
        //   await transSave(trans, indicator);
        //   indicatorDict[uri] = indicator;
        // }

      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorReportModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage',
          {uri, type: getPrefixedURI(object['@type'][0])}, {});
        indicatorReportDict[uri] = {_uri: uri};

        // if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'name')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'name'))} is missing`);
        //   // addMessage(8, 'propertyMissing',
        //   //   {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'name'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   hasName = getValue(object, GDBIndicatorReportModel, 'name');
        // }
        // let dateCreated;
        // if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated'))} is missing`);
        //   // addMessage(8, 'propertyMissing',
        //   //   {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   dateCreated = new Date(getValue(object, GDBIndicatorReportModel, 'dateCreated'))
        // }
        // let comment;
        // if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'comment')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'comment'))} is missing`);
        //   // addMessage(8, 'propertyMissing',
        //   //   {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'comment'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   comment = getValue(object, GDBIndicatorReportModel, 'comment')
        // }
        // let value
        // let measureURI = getValue(object, GDBIndicatorReportModel, 'value');
        // let measureObject = getObjectValue(object, GDBIndicatorReportModel, 'value');
        //
        // let numericalValue;
        // if (measureObject)
        //   numericalValue = getValue(measureObject, GDBMeasureModel, 'numericalValue')
        // if (!measureURI && !numericalValue){
        //   addTrace('        Error: Mandatory property missing');
        //   addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'value'))} is missing`);
        //   addMessage(8, 'propertyMissing',
        //     {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'value'))});
        //   error += 1;
        //   hasError = true;
        // } else {
        //   value = measureURI ||
        //     GDBMeasureModel({
        //       numericalValue
        //     },
        //     {uri: measureObject['@id']})
        // }
        // if (!hasError) {
        //   const indicatorReport = GDBIndicatorReportModel({
        //     name: hasName,
        //     dateCreated: dateCreated,
        //     comment: comment,
        //     value: value,
        //     forOrganization: organization._uri
        //     // hasTime: getValue(object, GDBIndicatorReportModel, 'hasTime') ||
        //     //   GDBDateTimeIntervalModel({
        //     //
        //     //     hasBeginning: getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0],
        //     //         GDBDateTimeIntervalModel, 'hasBeginning') ||
        //     //       GDBInstant({
        //     //         date: new Date(getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
        //     //           [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0], GDBInstant, 'date'))
        //     //       }, {
        //     //         uri: getFullObjectURI(
        //     //           object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
        //     //             [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0]
        //     //         )
        //     //       }),
        //     //
        //     //     hasEnd: getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0],
        //     //         GDBDateTimeIntervalModel, 'hasEnd') ||
        //     //       GDBInstant({
        //     //         date: new Date(getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
        //     //           [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0], GDBInstant, 'date'))
        //     //       }, {
        //     //         uri: getFullObjectURI(
        //     //           object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
        //     //             [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0]
        //     //         )
        //     //       })
        //     //   }, {uri: getFullObjectURI(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')])})
        //
        //
        //   }, {uri: uri});
        //   await transSave(trans, indicatorReport);
        //   indicatorReportDict[uri] = indicatorReport;
        // }

      } else if (object['@type'].includes(getFullTypeURI(GDBThemeModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        themeDict[uri] = {_uri: uri};


        // if (!object[getFullPropertyURI(GDBThemeModel, 'name')]) {
        //   addTrace('        Error: Mandatory property missing');
        //   addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'name'))} is missing`);
        //   addMessage(8, 'propertyMissing',
        //     {
        //       hasName,
        //       uri,
        //       type: getPrefixedURI(object['@type'][0]),
        //       property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'name'))
        //     });
        //   error += 1;
        //   hasError = true;
        // } else {
        //   hasName = getValue(object, GDBThemeModel, 'name');
        // }
        // let hasDescription;
        // if (!object[getFullPropertyURI(GDBThemeModel, 'description')]) {
        //   // addTrace('        Error: Mandatory property missing');
        //   // addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'description'))} is missing`);
        //   // addMessage(8, 'propertyMissing',
        //   //   {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'description'))});
        //   // error += 1;
        //   // hasError = true;
        // } else {
        //   hasDescription = getValue(object, GDBThemeModel, 'description');
        // }
        // if (!hasError) {
        //   const theme = GDBThemeModel({
        //     name: hasName,
        //     description: hasDescription
        //   }, {uri: uri});
        //   await transSave(trans, theme);
        // }
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
        error = await outcomeBuilder('fileUploading', trans, object, organization, error, {objectDict, outcomeDict}, {addMessage, addTrace, transSave, getFullPropertyURI, getValue, getListOfValue});
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {
        await indicatorBuilder(trans, object, organization,);
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorReportModel))) {
        await indicatorReportBuilder(trans, object, organization,);
      } else if (object['@type'].includes(getFullTypeURI(GDBThemeModel))) {
        await themeBuilder(trans, object, organization,);
      }
    }
    await transSave(trans, organization);
    // await organization.save();
    if (!error) {
      addTrace('    Start to insert data...');
      addMessage(4, 'insertData', {}, {});

      const indicators = Object.entries(indicatorDict).map(([uri, indicator]) => {
        return GDBIndicatorModel(
          indicator, {_uri: indicator._uri}
        );
      });
      await Promise.all(indicators.map(indicator => transSave(trans, indicator)))
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

module.exports = {fileUploadingHandler, transSave};