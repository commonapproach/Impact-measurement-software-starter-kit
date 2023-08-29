const {hasAccess} = require("../../helpers/hasAccess");
const {getRepository} = require("../../loaders/graphDB");
const {formatMessage, addMessage, isType} = require('./helpers');
const {Server400Error} = require("../../utils");
const {expand} = require("jsonld");
const {GDBOrganizationModel} = require("../../models/organization");
const {isValidURL} = require("../../helpers/validator");
const {GraphDB} = require("graphdb-utils");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBThemeModel} = require("../../models/theme");
const {indicatorBuilder} = require("./builders");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;


async function newFileUploadingHandler(req, res, next) {
  try {
    if (await hasAccess(req, 'fileUploading')) {
      const dicts = {
        object: {},
        outcome: {},
        theme: {},
        indicator: {},
        indicatorReportDict: {},
      };
      const messageBuffer = {
        begin: [], end: [], noURI: []
      };

      let errorCounter = 0;

      const repo = await getRepository();
      const trans = await repo.beginTransaction();
      trans.repositoryClientConfig.useGdbTokenAuthentication(repo.repositoryClientConfig.username, repo.repositoryClientConfig.pass);

      const {objects, organizationUri, fileName} = req.body;


      return await fileUploading(trans, {dicts, errorCounter, messageBuffer}, objects, {organizationUri, fileName}, {formatMessage, addMessage});
    } else {
      return res.status(400).json({message: 'Wrong Auth'});
    }
  } catch (e) {
    next(e);
  }
}


async function fileUploading(trans, holders, objects, fileInformation, helpers) {
  const {fileName, organizationUri} = fileInformation;
  let {dicts, errorCounter, messageBuffer} = holders;
  const {formatMessage, addMessage} = helpers
  addMessage(0, 'startToProcess', {fileName}, messageBuffer);


  if (!Array.isArray(objects)) {
    // the object should be an array
    errorCounter += 1;
    addMessage(0, 'fileNotAList', {});
    const msg = formatMessage();
    throw new Server400Error(msg);
  }

  if (!objects.length) {
    // the objects shouldn't be empty
    addMessage(0, 'fileEmpty', {}, messageBuffer)
    errorCounter += 1;
    const msg = formatMessage();
    throw new Server400Error(msg);
  }

  const expandedObjects = await expand(objects);

  if (!expandedObjects.length) {
    errorCounter += 1;
    addMessage(8, 'emptyExpandedObjects', {}, messageBuffer)
    const msg = formatMessage();
    throw new Server400Error(msg);
  }

  const organization = await GDBOrganizationModel.findOne({_uri: organizationUri}, {populates: ['hasOutcomes']});
  if (!organization) {
    addMessage(8, 'wrongOrganizationURI', {organizationUri}, messageBuffer);
    const msg = formatMessage();
    throw new Server400Error(msg);
  }

  for (let object of expandedObjects) {
    // store the raw object into objectDict
    const uri = object['@id'];
    if (!uri) {
      // in the case there is no URI
      errorCounter += 1;
      addMessage(8, 'noURI',
        {type: object['@type'][0]}, messageBuffer);
      continue;
    }
    if (!isValidURL(uri)){
      errorCounter += 1;
      addMessage(8, 'invalidURI', {uri, type: getPrefixedURI(object['@type'][0])});
      continue;
    }
    if (dicts.object[uri]) {
      // duplicated uri in the file
      errorCounter += 1;
      addMessage(8, 'duplicatedURIInFile', {uri, type: getPrefixedURI(object['@type'][0])}, messageBuffer)
      continue;
    }
    if (await GraphDB.isURIExisted(uri) && !object['@type'].includes(getFullURI('cids:Organization'))) {
      // check whether the uri belongs to other objects
      // duplicated uri in database
      errorCounter += 1;
      addMessage(8, 'duplicatedURIInDataBase', {uri, type: getPrefixedURI(object['@type'][0])}, messageBuffer)
      continue;
    }

    // assign the object an id and store them into specific dict
    dicts.object[uri] = object;
    if (isType(object, 'cids:Indicator')) {
      dicts['indicator'][uri] = {uri};
    } else if (isType(object, 'cids:Outcome')){
      dicts['outcome'][uri] = {uri};
    } else {
      addMessage(8, 'unsupportedObject', {uri}, messageBuffer)
    }
  }

  for (let [uri, object] of Object.entries(dicts.object)) {
    if (isType(object, 'cids:Indicator')) {
      await indicatorBuilder(trans, object, organization, dicts);
    }
  }





}

module.exports = {
  newFileUploadingHandler
}