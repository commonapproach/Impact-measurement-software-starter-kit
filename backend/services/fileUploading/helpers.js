const {isValidURL} = require("../../helpers/validator");
const {GDBOutcomeModel} = require("../../models/outcome");

const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

function addMessage(spaces, messageType,
                    {uri, fileName, organizationUri, type, property, hasName, value, referenceURI, subjectURI, error, url}, messageBuffer) {
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

const formatMessage = (messageBuffer) => {
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

function isType(object, uriNotFull) {
  return object['@type'].includes(getFullURI(uriNotFull))
}


module.exports = {
  addMessage, isType
}