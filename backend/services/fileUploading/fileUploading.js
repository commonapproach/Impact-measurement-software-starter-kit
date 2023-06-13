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
const {GDBUnitOfMeasure} = require("../../models/measure");
const {getFullURI, getPrefixedURI,} = require('graphdb-utils').SPARQL;

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

/**
 * return list of object URI
 * @param object
 * @param graphdbModel
 * @param property
 * @returns {*}
 */
const getListOfValue = (object, graphdbModel, property) => {
  return object[getFullURI(graphdbModel.schema[property].internalKey)].map(obj => obj['@value'])
}

const getFullTypeURI = (graphdbModel) => {
  return getFullURI(graphdbModel.schemaOptions.rdfTypes[1]);
}

const getFullPropertyURI = (graphdbModel, propertyName) => {
  return getFullURI(graphdbModel.schema[propertyName].internalKey)
}

async function outcomeBuilder(trans, object, organization, outcomeDict, indicatorDict) {
  const outcome = outcomeDict[object['@id']];
  // add the organization to it, and add it to the organization
  if (!outcome.forOrganizations)
    outcome.forOrganizations = [];
  outcome.forOrganizations.push(organization._uri);
  if (!organization.hasOutcomes)
    organization.hasOutcomes = [];
  organization.hasOutcomes.push(outcome._uri);
  // add theme to indicator
  if (!object['http://ontology.eil.utoronto.ca/cids/cids#forTheme'])
    throw new Server400Error(`${object['@id']}: outcome need to contain theme`);
  outcome.theme = object['http://ontology.eil.utoronto.ca/cids/cids#forTheme'][0]['@value'];
  // add indicator to outcome, adding outcome to indicator when treating indicators

  if (object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicator']) {
    if (!outcome.indicators) {
      outcome.indicators = [];
    }
    outcome.indicators.push(
      object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicator'][0]['@value']
    );

    // const indicator = indicatorDict[object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicator'][0]['@value']]
    //   || await GDBIndicatorModel.findOne({_uri: object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicator'][0]['@value']})
    // if (!indicator.forOutcomes)
    //   indicator.forOutcomes = []
    // indicator.forOutcomes.push(outcome._uri);
    // transSave(trans, indicator);
  }
  await transSave(trans, outcome);
}


// async function themeBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans) {
//   if (!object['tove_org:hasName']) {
//     throw new Server400Error('invalid input');
//   }
//   let theme = await GDBThemeModel.findOne({name: object['tove_org:hasName']});
//   if (!theme) {
//     // the theme has to be created
//     theme = GDBThemeModel({
//       name: object['tove_org:hasName'],
//       description: object['cids:hasDescription']
//     });
//   } else {
//     throw new Server400Error('The theme is duplicate');
//     // the theme has to be modified
//     if (!themeDict[theme._id]) {
//       // theme name shouldn't be able to be changed
//       // theme.name = object['tove_org:hasName'];
//       theme.description = object['cids:hasDescription'];
//     }
//   }
//   await transSave(trans, theme);
//   themeDict[theme._id] = theme;
//   return theme;
// }


async function indicatorBuilder(trans, object, organization, indicatorDict, objectDict) {
  const uri = object['@id']
  const indicator = indicatorDict[uri];

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
        if (!outcome)
          throw new Server400Error(`Wrong input value: Outcome ${outcomeURI} doesn't exit on both the file and the database`);
        // todo: check if the outcome belongs to the organization
        if (outcome.forOrganization !== organization._uri)
          throw new Server400Error(`Wrong input value: Outcome ${outcomeURI} doesn't belong to this organization`);
        if (!outcome.indicators)
          outcome.indicators = [];
        outcome.indicators.push(uri);
        await transSave(trans, outcome);
      } // if the outcome is in the file, don't have to worry about adding the indicator to the outcome
    }
  }

  // add indicator report
  if (object[getFullPropertyURI(GDBIndicatorModel, 'indicatorReports')]) {
    if (!indicator.indicatorReports)
      indicator.indicatorReports = [];
    getListOfValue(object, GDBIndicatorModel, 'indicatorReports').map(indicatorReportURI => {
      indicator.indicatorReports.push(indicatorReportURI)
    })
    // object[getFullPropertyURI(GDBIndicatorModel, 'indicatorReports')].map(indicatorReport => {
    //   indicator.indicatorReports.push(
    //     indicatorReport['@value']
    //   );
    // });
  }
  await transSave(trans, indicator);
}

async function indicatorReportBuilder(trans, object, organization, indicatorReportDict, indicatorDict) {
  const indicatorReport = indicatorReportDict[object['@id']];
  // add the organization to it
  indicatorReport.forOrganization = organization._uri;
  // add indicator
  indicatorReport.forIndicator = object['http://ontology.eil.utoronto.ca/cids/cids#forIndicator'][0]['@value'];
  const indicator = indicatorDict[object['http://ontology.eil.utoronto.ca/cids/cids#forIndicator'][0]['@value']] || ''; // todo: may need to fetch indicator from database
  // if (object['http://ontology.eil.utoronto.ca/cids/cids#forIndicator']) {
  //   indicatorReport.forIndicator = `:indicator_${indicator._id}`;
  //   if(!indicator.indicatorReports)
  //     indicator.indicatorReports = [];
  //   indicator.indicatorReports.push(`:indicatorReport_${indicatorReport._id}`);
  // }
  // todo: add hasTime and hasValue

  await transSave(trans, indicatorReport);
}

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
    const {objects, organizationUri} = req.body;
    const expandedObjects = await expand(objects);

    const organization = await GDBOrganizationModel.findOne({_uri: organizationUri}, {populates: ['hasOutcomes']});
    const objectDict = {};
    const outcomeDict = {};
    const themeDict = {};
    const indicatorDict = {};
    const indicatorReportDict = {};
    if (!organization)
      throw new Server400Error('Wrong organization ID');
    for (let object of expandedObjects) {
      // store the raw object into objectDict
      const uri = object['@id'];
      objectDict[uri] = object;
      // assign the object an id and store them into specific dict
      if (object['@type'].includes(getFullTypeURI(GDBOutcomeModel))) { //todo: here don't have to be hardcoded
        if (!object[getFullPropertyURI(GDBOutcomeModel, 'name')] ||
          !object[getFullPropertyURI(GDBOutcomeModel, 'description')]
        )
          throw new Server400Error(`${object['@id']}: invalid input`);
        const outcome = GDBOutcomeModel({
          name: getValue(object, GDBOutcomeModel, 'name'),
          description: getValue(object, GDBOutcomeModel, 'description'),
        }, {uri: uri});
        await transSave(trans, outcome);
        outcomeDict[uri] = outcome;
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {
        if (!object[getFullPropertyURI(GDBIndicatorModel, 'name')] ||
          !object[getFullPropertyURI(GDBIndicatorModel, 'description')] ||
          !object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')])

          throw new Server400Error(`${uri}: invalid input`);
        const indicator = GDBIndicatorModel({
          name: getValue(object, GDBIndicatorModel, 'name'),
          description: getValue(object, GDBIndicatorModel, 'description'),
          unitOfMeasure: getValue(object, GDBIndicatorModel, 'unitOfMeasure') ||
            {
              label: getValue(object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')][0],
                GDBUnitOfMeasure, 'label'
                )
            }
        }, {uri: uri});
        await transSave(trans, indicator);
        indicatorDict[uri] = indicator;
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorReportModel))) {
        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'name')] || !object[getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated')] ||
          !object[getFullPropertyURI(GDBIndicatorReportModel, 'comment')])
          throw new Server400Error(`${uri}: invalid input`);
        const indicatorReport = GDBIndicatorReportModel({
          name: getValue(object, GDBIndicatorReportModel, 'name'),
          dateCreated: new Date(getValue(object, GDBIndicatorReportModel, 'dateCreated')),
          comment: getValue(object, GDBIndicatorReportModel, 'comment')
        }, {uri: uri});
        await transSave(trans, indicatorReport);
        indicatorReportDict[uri] = indicatorReport;
      } else if (object['@type'].includes(getFullTypeURI(GDBThemeModel))) {
        if (!object[getFullPropertyURI(GDBThemeModel, 'name')] ||
          !object[getFullPropertyURI(GDBThemeModel, 'description')])
          throw new Server400Error(`${object['@id']}: invalid input`);
        const theme = GDBThemeModel({
          name: getValue(object, GDBThemeModel, 'name'),
          description: getValue(object, GDBThemeModel, 'description')
        }, {uri: uri});
        await transSave(trans, theme);
        themeDict[uri] = theme;
      }
    }


    for (let object of expandedObjects) {
      if (object['@type'].includes(getFullTypeURI(GDBOutcomeModel))) {
        await outcomeBuilder(trans, object, organization, outcomeDict);
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {
        await indicatorBuilder(trans, object, organization, indicatorDict, objectDict);
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorReportModel))) {
        await indicatorReportBuilder(trans, object, organization, indicatorReportDict);
        // todo: add time interval... etc
      } else if (object['@type'].includes(getFullTypeURI(GDBThemeModel))) {

      }
    }
    await organization.save();
    await trans.commit();
    return res.status(200).json({success: true});
  } catch (e) {
    await trans.rollback();
    next(e);
  }
};

module.exports = {fileUploadingHandler};