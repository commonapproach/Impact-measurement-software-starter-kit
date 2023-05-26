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

const fileUploadingHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fileUploading'))
      return await fileUploading(req, res, next);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

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
    throw new Server400Error(`${object['@id']}: outcome need to contain theme`)
  outcome.theme = object['http://ontology.eil.utoronto.ca/cids/cids#forTheme'][0]['@value'];
  // add indicator to outcome, adding outcome to indicator when treating indicators

  if (object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicator']) {
    if (!outcome.indicators) {
      outcome.indicators = [];
    }
    outcome.indicators.push(
      object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicator'][0]['@value']
    )

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


async function indicatorBuilder(trans,object, organization, indicatorDict) {
  const indicator = indicatorDict[object['@id']];
  // add the organization to it, and add it to the organization
  if (!indicator.forOrganizations)
    indicator.forOrganizations = [];
  indicator.forOrganizations.push(organization._uri);
  if (!organization.hasIndicators)
    organization.hasIndicators = [];
  organization.hasIndicators.push(indicator._uri);
  // add outcome
  if (object['http://ontology.eil.utoronto.ca/cids/cids#forOutcome']) {
    if (!indicator.forOutcomes) {
      indicator.forOutcomes = [];
    }
    indicator.forOutcomes.push(object['http://ontology.eil.utoronto.ca/cids/cids#forOutcome'][0]['@value'])
  }
  // add indicator report
  if (object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicatorReport']) {
    if (!indicator.indicatorReports)
      indicator.indicatorReports = [];
    object['http://ontology.eil.utoronto.ca/cids/cids#hasIndicatorReport'].map(indicatorReport => {
      indicator.indicatorReports.push(
        indicatorReport['@value']
      )
    })
  }
  // todo: add indicator report
  await transSave(trans, indicator);
}

async function indicatorReportBuilder(trans, object, organization, indicatorReportDict, indicatorDict) {
  const indicatorReport = indicatorReportDict[object['@id']];
  // add the organization to it
  indicatorReport.forOrganization = organization._uri;
  // add indicator
  indicatorReport.forIndicator = object['http://ontology.eil.utoronto.ca/cids/cids#forIndicator'][0]['@value']
  const indicator = indicatorDict[object['http://ontology.eil.utoronto.ca/cids/cids#forIndicator'][0]['@value']] || '' // todo: may need to fetch indicator from database
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
    const {objects, organizationId} = req.body;
    const expandedObjects = await expand(objects);
    // const frm = {
    //   "@context": "http://ontology.eil.utoronto.ca/cids/contexts/cidsContext.json",
    //   "@type": "cids:Outcome",
    //   "hasName": {},
    //   "hasDescription": {"@type": "Text"},
    //   "forDomain": {"@type": "http://ontology.eil.utoronto.ca/cids/cids#Domain"},
    //   "dateCreated": {"type": "Date"}
    // };
    const organization = await GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasOutcomes']});
    const objectDict = {};
    const outcomeDict = {};
    const themeDict = {};
    const indicatorDict = {};
    const indicatorReportDict = {};
    if (!organization)
      throw new Server400Error('Wrong organization ID');

    for (let object of expandedObjects) {
      // store the raw object into objectDict
      objectDict[object['@id']] = object;
      // assign the object an id and store them into specific dict
      if (object['@type'].includes('http://ontology.eil.utoronto.ca/cids/cids#Outcome')) {
        if (!object['http://ontology.eil.utoronto.ca/cids/cids#hasName'] ||
          !object['http://ontology.eil.utoronto.ca/cids/cids#hasDescription']
          // || !object['http://schema.org/dateCreated']
        )
          throw new Server400Error(`${object['@id']}: invalid input`);
        const outcome = GDBOutcomeModel({
          name: object['http://ontology.eil.utoronto.ca/cids/cids#hasName'][0]['@value'],
          description: object['http://ontology.eil.utoronto.ca/cids/cids#hasDescription'][0]['@value'],
        }, {uri: object['@id']});
        await transSave(trans, outcome);
        outcomeDict[object['@id']] = outcome;
      } else if (object['@type'].includes('http://ontology.eil.utoronto.ca/cids/cids#Indicator')) {
        if (!object['http://ontology.eil.utoronto.ca/cids/cids#hasName'].length ||
          !object['http://ontology.eil.utoronto.ca/cids/cids#hasDescription'].length)
          throw new Server400Error(`${object['@id']}: invalid input`);
        const indicator = GDBIndicatorModel({
          name: object['http://ontology.eil.utoronto.ca/cids/cids#hasName']['@value'],
          description: object['http://ontology.eil.utoronto.ca/cids/cids#hasDescription']['@value'],
          // todo: add unit of measure
          // unitOfMeasure: {
          //
          // }
        }, {uri: object['@id']});
        await transSave(trans, indicator);
        indicatorDict[object['@id']] = indicator;
      } else if (object['@type'].includes('http://ontology.eil.utoronto.ca/cids/cids#IndicatorReport')) {
        if (!object['http://ontology.eil.utoronto.ca/tove/organization#hasName'] || !object['http://schema.org/dateCreated'] ||
        !object['http://ontology.eil.utoronto.ca/cids/cids#hasComment'])
          throw new Server400Error(`${object['@id']}: invalid input`);
        const indicatorReport = GDBIndicatorReportModel({
          name: object['http://ontology.eil.utoronto.ca/tove/organization#hasName'][0]['@value'],
          dateCreated: object['http://schema.org/dateCreated'][0]['@value'],
          comment: object['http://ontology.eil.utoronto.ca/cids/cids#hasComment'][0]['@value']
        }, {uri: object['@id']});
        await transSave(trans, indicatorReport);
        indicatorReportDict[object['@id']] = indicatorReport;
      } else if(object['@type'].includes('http://ontology.eil.utoronto.ca/cids/cids#Theme')) {
        if (!object['http://ontology.eil.utoronto.ca/tove/organization#hasName'] ||
          !object['http://ontology.eil.utoronto.ca/cids/cids#hasDescription'])
          throw new Server400Error(`${object['@id']}: invalid input`);
        const theme = GDBThemeModel({
          name: object['http://ontology.eil.utoronto.ca/tove/organization#hasName'][0]['@value'],
          description: object['http://ontology.eil.utoronto.ca/cids/cids#hasDescription'][0]['@value']
        }, {uri: object['@id']})
        await transSave(trans, theme);
        themeDict[object['@id']] = theme;
      }
    }


    for (let object of expandedObjects) {
      if (object['@type'].includes('http://ontology.eil.utoronto.ca/cids/cids#Outcome')) {
        await outcomeBuilder(trans, object, organization, outcomeDict);
      } else if (object['@type'].includes('http://ontology.eil.utoronto.ca/cids/cids#Indicator')) {
        await indicatorBuilder(trans, object, organization, indicatorDict)
      } else if (object['@type'].includes('http://ontology.eil.utoronto.ca/cids/cids#IndicatorReport')) {
        await indicatorReportBuilder(trans, object, organization, indicatorReportDict)
      } // todo: add time interval... etc
      // switch (object['@type'][0]) {
      //   case 'cids:Outcome':
      //     await outcomeBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans);
      //     break;
      //   case 'cids:hasIndicator':
      //     await indicatorBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans);
      //     break;
      //   case 'cids:Theme':
      //     await themeBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans);
      //     break;
      //
      // }
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