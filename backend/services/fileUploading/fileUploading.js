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
  return object[getFullURI(graphdbModel.schema[property].internalKey)][0]['@value'];
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
      })
      Object.keys(messageBuffer).map(uri => {
        if (uri !== 'begin' && uri !== 'end') {
          messageBuffer[uri].map(sentence => {
            msg += sentence + '\n';
          })
        }
      })
      messageBuffer.end?.map(sentence => {
        msg += sentence + '\n'
      })
      return msg;
    }

    function addMessage(spaces, messageType,
                        {uri, fileName, organizationUri, type, property, hasName, value, referenceURI, subjectURI, error, url}) {
      let whiteSpaces = ''
      if (spaces)
        [...Array(spaces).keys()].map(() => {
          whiteSpaces += ' '
        })
      if (uri && !messageBuffer[uri]){
        messageBuffer[uri] = []
      }

      switch (messageType) {
        case 'startToProcess':
          messageBuffer['begin'].push(whiteSpaces + `Loading file ${fileName}...`);
          break;
        case 'fileNotAList':
          messageBuffer['begin'].push(whiteSpaces + 'Error');
          messageBuffer['begin'].push(whiteSpaces + 'The file should contain a list (start with [ and end with ] ) of json objects.');
          messageBuffer['begin'].push(whiteSpaces + 'Please consult the JSON-LD reference at: https://json-ld.org/');
          break;
        case 'fileEmpty':
          messageBuffer['begin'].push(whiteSpaces + 'Warning!');
          messageBuffer['begin'].push(whiteSpaces + 'The file is empty');
          messageBuffer['begin'].push(whiteSpaces + 'There is nothing to upload');
          break;
        case 'addingToOrganization':
          messageBuffer['begin'].push(whiteSpaces + 'Adding objects to organization with URI: ' + organizationUri);
          messageBuffer['begin'].push(whiteSpaces + '');
          break;
        case 'emptyExpandedObjects':
          messageBuffer['begin'].push(whiteSpaces + 'Warning!');
          messageBuffer['begin'].push(whiteSpaces + '    Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. '
            + 'Some objects must have a @context');
          messageBuffer['begin'].push(whiteSpaces + '    Read more about JSON-LD  at: https://json-ld.org/')
          messageBuffer['begin'].push(whiteSpaces + '    Nothing was uploaded');
          break;
        case 'wrongOrganizationURI':
          messageBuffer['begin'].push(whiteSpaces + `Error: Incorrect organization URI ${organizationUri}: No such Organization`);
          messageBuffer['begin'].push(whiteSpaces + '    The file failed to upload');
          break;
        case 'invalidURI':
          messageBuffer[uri].push(`\n`)
          messageBuffer[uri].push(whiteSpaces + 'Error: Invalid URI')
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an invalid URI`);
          break;
        case 'duplicatedURIInFile':
          messageBuffer[uri].push(whiteSpaces + 'Error: Duplicated URI');
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an URI already in another object in this file`);
          break;
        case 'duplicatedURIInDataBase':
          messageBuffer[uri].push(whiteSpaces + 'Error: Duplicated URI');
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an URI already in another object in the sandbox`);
          break;
        case 'readingMessage':
          messageBuffer[uri].push(whiteSpaces + `Reading object with URI ${uri} of type ${type}...`);
          break;
        case 'propertyMissing':
          messageBuffer[uri].push(whiteSpaces + `Error: Mandatory property missing`);
          messageBuffer[uri].push(whiteSpaces + `    In object${hasName? ' ' + hasName : ''} with URI ${uri} of type ${type} property ${property} is missing`);
          break;
        case 'differentOrganization':
          messageBuffer['begin'].push(whiteSpaces + `Error:`);
          messageBuffer['begin'].push(whiteSpaces + `    Organization in the file(URI: ${uri}) is different from the organization chosen in the interface(URI: ${organizationUri})`);
          break;
        case 'sameOrganization':
          messageBuffer['begin'].push(whiteSpaces + ' Warning: organization object is ignored');
          messageBuffer['begin'].push(whiteSpaces + `    Organization information can only be updated through the interface`);
          break;
        case 'unsupportedObject':
          messageBuffer['end'].push(whiteSpaces + 'Warning!');
          messageBuffer['end'].push(whiteSpaces + `    Object with URI ${uri} is being ignored: The object type is not supported`)
          break;
        case 'invalidValue':
          messageBuffer[uri].push(whiteSpaces + 'Error: Invalid URI');
          messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} attribute ${property}  contains invalid value(s): ${value}`);
          break;
        case 'badReference':
          messageBuffer[uri].push(whiteSpaces + 'Error: bad reference');
          messageBuffer[uri].push(whiteSpaces + `    ${type} ${referenceURI} appears neither in the file nor in the sandbox`);
          break;
        case 'subjectDoesNotBelong':
          messageBuffer[uri].push(whiteSpaces + 'Error:');
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
          messageBuffer['begin'].push(whiteSpaces + 'Error: Invalid URL in context: ' + url);
          messageBuffer['end'].push(`File failed to upload`);
          break;
        case 'noURI':
          messageBuffer['noURI'].push(whiteSpaces + `Error: No URI`);
          messageBuffer['noURI'].push(whiteSpaces +`    One object${type? ` with type ${type}`: ''} has no URI`);
          messageBuffer['noURI'].push(whiteSpaces +'    The object is ignored');
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
          addTrace(`            In object with URI ${object['@id']} of type ${getPrefixedURI(object['@type'][0])} attribute ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))}  contains invalid value(s): ${obj['@value']}`);
          addMessage(8, 'invalidValue',
            {uri:object['@id'], type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes')), value: obj['@value']})
        }

      });
      return ret.filter(uri => !!uri);
    };

    function addTrace(message) {
      console.log(message);
      traceOfUploading += message + '\n';
    }

    async function outcomeBuilder(trans, object, organization) {
      const uri = object['@id'];
      const outcome = outcomeDict[uri];
      let hasError = false;
      if (outcome) {
        // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);


        // add the organization to it, and add it to the organization
        outcome.forOrganization = organization._uri;
        if (!organization.hasOutcomes)
          organization.hasOutcomes = [];
        organization.hasOutcomes.push(outcome._uri);

        // add theme to outcome
        if (!object[getFullPropertyURI(GDBOutcomeModel, 'themes')]) {
          // addTrace('        Error: Mandatory property missing');
          // addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))} is missing`);
          // addMessage(8, 'propertyMissing', {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))});
          // error += 1;
          // hasError = true;
        } else {
          outcome.themes = getListOfValue(object, GDBOutcomeModel, 'themes');
        }


        // add indicator to outcome
        if (!object[getFullPropertyURI(GDBOutcomeModel, 'indicators')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'indicators'))} is missing`);
          addMessage(8, 'propertyMissing', {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'indicators'))});
          error += 1;
          hasError = true;
        } else {
          if (!outcome.indicators)
            outcome.indicators = [];
          for (const indicatorURI of getListOfValue(object, GDBOutcomeModel, 'indicators')) {
            outcome.indicators.push(indicatorURI);
            // add outcome to indicator
            if (!objectDict[indicatorURI]) {
              //in this case, the indicator is not in the file, get the indicator from database and add the outcome to it
              const indicator = await GDBIndicatorModel.findOne({_uri: indicatorURI});
              if (!indicator) {
                addTrace('        Error: bad reference');
                addTrace(`            Indicator ${indicatorURI} appears neither in the file nor in the sandbox`);
                addMessage(8, 'badReference',
                  {uri, referenceURI: indicatorURI, type:'Indicator'});
                error += 1;
                hasError = true;
              } else if (!indicator.forOrganizations.includes(organization._uri)) {
                addTrace('        Error:');
                addTrace(`            Indicator ${indicatorURI} does not belong to this organization`);
                addMessage(8, 'subjectDoesNotBelong', {uri, type: 'Indicator', subjectURI: indicatorURI})
                error += 1;
                hasError = true;
              } else {
                if (!indicator.forOutcomes)
                  indicator.forOutcomes = [];
                indicator.forOutcomes.push(uri);
                await transSave(trans, indicator);
              }

            } // if the indicator is in the file, don't have to worry about adding the outcome to the indicator
          }
        }

        await transSave(trans, outcome);
        if (hasError) {
          // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
        } else {
          addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
          addMessage(4, 'finishedReading',
            {uri, type:getPrefixedURI(object['@type'][0])})
        }

      } else {
        // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
      }

    }

    async function themeBuilder(trans, object, organization) {
      const uri = object['@id'];
      const theme = themeDict[uri];
      if (theme) {
        // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        await transSave(trans, theme);
        addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'finishedReading',
          {uri, type:getPrefixedURI(object['@type'][0])})
      } else {
        // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
      }

    }

    async function indicatorBuilder(trans, object, organization) {
      const uri = object['@id'];
      let hasError = false;
      const indicator = indicatorDict[uri];
      if (indicator) {
        // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);

        // add the organization to it, and add it to the organization
        if (!indicator.forOrganizations)
          indicator.forOrganizations = [];
        indicator.forOrganizations.push(organization._uri);
        if (!organization.hasIndicators)
          organization.hasIndicators = [];
        organization.hasIndicators.push(indicator._uri);

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
                  {uri, referenceURI: outcomeURI, type:'Outcome'});
                error += 1;
              }else if (outcome.forOrganization !== organization._uri) {
                // check if the outcome belongs to the organization
                addTrace('        Error:');
                addTrace(`            Outcome ${outcomeURI} doesn't belong to this organization`);
                addMessage(8, 'subjectDoesNotBelong',
                  {uri, type: 'Outcome', subjectURI: outcomeURI});
                error += 1;
              } else {
                if (!outcome.indicators)
                  outcome.indicators = [];
                outcome.indicators.push(uri);
                await transSave(trans, outcome);
              }

            } // if the outcome is in the file, don't have to worry about adding the indicator to the outcome
          }
        }

        // add indicator report
        if (object[getFullPropertyURI(GDBIndicatorModel, 'indicatorReports')]) {
          if (!indicator.indicatorReports)
            indicator.indicatorReports = [];
          getListOfValue(object, GDBIndicatorModel, 'indicatorReports').map(indicatorReportURI => {
            indicator.indicatorReports.push(indicatorReportURI);
          });
        }
        await transSave(trans, indicator);
        if (hasError) {
          // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
        } else {
          addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
          addMessage(4, 'finishedReading',
            {uri, type:getPrefixedURI(object['@type'][0])});
        }
      } else {
        // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
      }

    }

    async function indicatorReportBuilder(trans, object, organization) {
      const uri = object['@id'];
      let hasError = false;
      const indicatorReport = indicatorReportDict[uri];
      if (indicatorReport) {
        // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        // add the organization to it
        indicatorReport.forOrganization = organization._uri;

        // add indicator to the indicatorReport
        const indicatorURI = getValue(object, GDBIndicatorReportModel, 'forIndicator');
        indicatorReport.forIndicator = indicatorURI;

        // add the indicatorReport to indicator if needed
        if (!objectDict[indicatorURI]) {
          // the indicator is not in the file, fetch it from the database and add the indicatorReport to it
          const indicator = await GDBIndicatorModel.findOne({_uri: indicatorURI});
          if (!indicator) {
            addTrace('        Error: bad reference');
            addTrace(`            Indicator ${indicatorURI} appears neither in the file nor in the sandbox`);
            addMessage(8, 'badReference',
              {uri, referenceURI: indicatorURI, type:'Indicator'});
            error += 1;
          }else if (!indicator.forOrganizations.includes(organization._uri)) {
            addTrace('        Error:');
            addTrace(`            Indicator ${indicatorURI} doesn't belong to this organization`);
            addMessage(8, 'subjectDoesNotBelong',
              {uri, type: 'Indicator', subjectURI: indicatorURI});
            error += 1;
          } else {
            if (!indicator.indicatorReports) {
              indicator.indicatorReports = [];
            }
            indicator.indicatorReports.push(indicatorReport);
            await transSave(trans, indicator);
          }

        }

        await transSave(trans, indicatorReport);

        if (hasError) {
          // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
        } else {
          addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
          addMessage(4, 'finishedReading',
            {uri, type:getPrefixedURI(object['@type'][0])});
        }
      } else {
        // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
      }

    }

    const {objects, organizationUri, fileName} = req.body;
    addTrace(`Loading file ${fileName}...`);
    addMessage(0, 'startToProcess', {fileName});
    if (!Array.isArray(objects)) {
      // the object should be an array
      addTrace('Error');
      addTrace('The file should contain a list (start with [ and end with ] ) of json objects.');
      addTrace('Please consult the JSON-LD reference at: https://json-ld.org/')
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
      addMessage(0, 'fileEmpty', {})
      error += 1;
      const msg = formatMessage();
      throw new Server400Error(msg);
    }
    addTrace('    Adding objects to organization with URI: ' + organizationUri);
    addTrace('');
    addMessage(4, 'addingToOrganization', {organizationUri})

    const expandedObjects = await expand(objects);

    if (!expandedObjects.length) {
      addTrace('        Warning!');
      // addTrace('Got an empty list from json-ld expanded function...');
      addTrace('            Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. ' +
        'Some objects must have a @context');
      addTrace('            Read more about JSON-LD  at: https://json-ld.org/');
      addTrace('            Nothing was uploaded');
      error += 1;
      addMessage(8, 'emptyExpandedObjects', {})
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
        error += 1;
        addMessage(8, 'noURI',
          {type: object['@type'][0]});
        continue;
      }
      if (!isValidURL(uri)){
        error += 1;
        addTrace('        Error: Invalid URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an invalid URI`);
        addMessage(8, 'invalidURI', {uri, type: getPrefixedURI(object['@type'][0])});
        continue;
      }
      if (objectDict[uri]) {
        // duplicated uri in the file
        error += 1;
        addTrace('        Error: Duplicated URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an URI already in another object in this file`);
        addMessage(8, 'duplicatedURIInFile', {uri, type: getPrefixedURI(object['@type'][0])})
        continue;
      }
      if (await GraphDB.isURIExisted(uri) && !object['@type'].includes(getFullTypeURI(GDBOrganizationModel))) {
        // check whether the uri belongs to other objects
        // duplicated uri in database
        error += 1;
        addTrace('        Error: Duplicated URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an URI already in another object in the sandbox`);
        addMessage(8, 'duplicatedURIInDataBase', {uri, type: getPrefixedURI(object['@type'][0])})
        continue;
      }

      objectDict[uri] = object;
      // assign the object an id and store them into specific dict
      let hasError = false;
      let hasName = null;
      if (object['@type'].includes(getFullTypeURI(GDBOutcomeModel))) { // todo: here don't have to be hardcoded

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4,'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])})

        if (!object[getFullPropertyURI(GDBOutcomeModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'name'))} is missing`);
          addMessage(8, 'propertyMissing', {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'name'))})
          error += 1;
          hasError = true;
        } else {
          hasName = getValue(object, GDBOutcomeModel, 'name');
        }
        if (!object[getFullPropertyURI(GDBOutcomeModel, 'description')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'description'))} is missing`);
          addMessage(8, 'propertyMissing',
            {uri, type: getPrefixedURI(object['@type'][0]),hasName, property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'description'))});
          error += 1;
          hasError = true;
        }
        if (!hasError) {
          const outcome = GDBOutcomeModel({
            name: hasName,
            description: getValue(object, GDBOutcomeModel, 'description'),
          }, {uri: uri});
          await transSave(trans, outcome);
          outcomeDict[uri] = outcome;
        }
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4,'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])})

        if (!object[getFullPropertyURI(GDBIndicatorModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'name'))} is missing`);
          addMessage(8, 'propertyMissing', {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'name'))});
          error += 1;
          hasError = true;
        } else {
          hasName = getValue(object, GDBIndicatorModel, 'name');
        }

        if (!object[getFullPropertyURI(GDBIndicatorModel, 'description')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'description'))} is missing`);
          addMessage(8, 'propertyMissing',
            {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'description'))});
          error += 1;
          hasError = true;
        }

        if (!object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure'))} is missing`);
          addMessage(8, 'propertyMissing',
            {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure'))});
          error += 1;
          hasError = true;
        }

        // if there is error on building up indicator
        if (!hasError) {
          const indicator = GDBIndicatorModel({
            name: hasName,
            description: getValue(object, GDBIndicatorModel, 'description'),
            unitOfMeasure: getValue(object, GDBIndicatorModel, 'unitOfMeasure') ||
              GDBUnitOfMeasure({
                  label: getValue(object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')][0],
                    GDBUnitOfMeasure, 'label'
                  )
                },
                {uri: getFullObjectURI(object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')][0])})

          }, {uri: uri});
          await transSave(trans, indicator);
          indicatorDict[uri] = indicator;
        }

      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorReportModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4,'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])})

        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'name'))} is missing`);
          addMessage(8, 'propertyMissing',
            {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'name'))});
          error += 1;
          hasError = true;
        } else {
          hasName = getValue(object, GDBIndicatorReportModel, 'name');
        }
        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated'))} is missing`);
          addMessage(8, 'propertyMissing',
            {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated'))});
          error += 1;
          hasError = true;
        }
        let comment;
        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'comment')]) {
          // addTrace('        Error: Mandatory property missing');
          // addTrace(`            In object${hasName ? ' ' + hasName:''} with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'comment'))} is missing`);
          // addMessage(8, 'propertyMissing',
          //   {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'comment'))});
          // error += 1;
          // hasError = true;
        } else {
          comment = getValue(object, GDBIndicatorReportModel, 'comment')
        }
        if (!hasError) {
          const indicatorReport = GDBIndicatorReportModel({
            name: hasName,
            dateCreated: new Date(getValue(object, GDBIndicatorReportModel, 'dateCreated')),
            comment: comment,

            value: getValue(object, GDBIndicatorReportModel, 'value') ||
              GDBMeasureModel({
                  numericalValue: getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'value')][0],
                    GDBMeasureModel, 'numericalValue'
                  ),
                },
                {uri: getFullObjectURI(object[getFullPropertyURI(GDBIndicatorReportModel, 'value')][0])}),

            hasTime: getValue(object, GDBIndicatorReportModel, 'hasTime') ||
              GDBDateTimeIntervalModel({

                hasBeginning: getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0],
                    GDBDateTimeIntervalModel, 'hasBeginning') ||
                  GDBInstant({
                    date: new Date(getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
                      [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0], GDBInstant, 'date'))
                  }, {
                    uri: getFullObjectURI(
                      object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
                        [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0]
                    )
                  }),

                hasEnd: getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0],
                    GDBDateTimeIntervalModel, 'hasEnd') ||
                  GDBInstant({
                    date: new Date(getValue(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
                      [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0], GDBInstant, 'date'))
                  }, {
                    uri: getFullObjectURI(
                      object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')][0]
                        [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0]
                    )
                  })
              }, {uri: getFullObjectURI(object[getFullPropertyURI(GDBIndicatorReportModel, 'hasTime')])})


          }, {uri: uri});
          await transSave(trans, indicatorReport);
          indicatorReportDict[uri] = indicatorReport;
        }

      } else if (object['@type'].includes(getFullTypeURI(GDBThemeModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4,'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])})

        if (!object[getFullPropertyURI(GDBThemeModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'name'))} is missing`);
          addMessage(8, 'propertyMissing',
            {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'name'))});
          error += 1;
          hasError = true;
        } else {
          hasName = getValue(object, GDBThemeModel, 'name');
        }
        if (!object[getFullPropertyURI(GDBThemeModel, 'description')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'description'))} is missing`);
          addMessage(8, 'propertyMissing',
            {hasName, uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'description'))});
          error += 1;
          hasError = true;
        }
        if (!hasError) {
          const theme = GDBThemeModel({
            name: getValue(object, GDBThemeModel, 'name'),
            description: getValue(object, GDBThemeModel, 'description')
          }, {uri: uri});
          await transSave(trans, theme);
          themeDict[uri] = theme;
        }
      } else if (object['@type'].includes(getFullTypeURI(GDBUnitOfMeasure))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4,'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])})

        if (!object[getFullPropertyURI(GDBUnitOfMeasure, 'label')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))} is missing`);
          addMessage(8, 'propertyMissing',
            {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))});
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
        addMessage(4,'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])})

        if (!object[getFullPropertyURI(GDBMeasureModel, 'numericalValue')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} ${getPrefixedURI(getFullPropertyURI(GDBMeasureModel, 'numericalValue'))} is missing`);
          addMessage(8, 'propertyMissing',
            {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBMeasureModel, 'numericalValue'))});
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
        addMessage(4,'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])})

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
            {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning'))});
          error += 1;
          hasError = true;
        }

        if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd'))} is missing`);
          addMessage(8, 'propertyMissing',
            {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd'))});
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

      } else if(object['@type'].includes(getFullTypeURI(GDBOrganizationModel))) {
          if (object['@id'] !== organizationUri) {
            addTrace('        Error:');
            addTrace('             Organization in the file is different from the organization chosen in the interface');
            addMessage(8, 'differentOrganization',
              {uri, organizationUri});
            error += 1;

          } else {
            addTrace(`        Warning: organization object is ignored`);
            addTrace(`            Organization information can only be updated through the interface`);
            addMessage(8, 'sameOrganization', {uri});
          }

      } else {
        addTrace('        Warning!');
        addTrace(`            Object with URI ${uri} is being ignored: The object type is not supported`);
        addMessage(8, 'unsupportedObject', {uri})
      }
    }


    for (let [uri, object] of Object.entries(objectDict)) {
      if (object['@type'].includes(getFullTypeURI(GDBOutcomeModel))) {
        await outcomeBuilder(trans, object, organization,);
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
      addMessage(4, 'insertData', {})
      await trans.commit();
      addTrace(`Completed loading ${fileName}`);
      addMessage(0, 'completedLoading', {fileName})
    } else {
      addTrace(`${error} error(s) found`);
      addTrace(`File failed to upload`);
      addMessage(0, 'errorCounting', {error})
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
    if (e.name === 'jsonld.InvalidUrl'){
      addMessage(4, 'invalidURL', {url: e.details.url})
      e.message = formatMessage();
    }
    next(e);
  }
};

module.exports = {fileUploadingHandler};