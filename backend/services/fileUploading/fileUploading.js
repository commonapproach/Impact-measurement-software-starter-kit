const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBThemeModel} = require("../../models/theme");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");
const {getRepository} = require("../../loaders/graphDB");
const {UpdateQueryPayload,} = require('graphdb').query;
const {QueryContentType} = require('graphdb').http;

const fileUploadingHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fileUploading'))
      return await fileUploading(req, res, next);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

async function outcomeBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans) {
  if (!object['cids:hasName'] || !object['sch:dateCreated'] || !object['cids:forTheme']) {
    throw new Server400Error('invalid input');
  }
  // assume that an outcome will uniquely be defined by name
  let outcome = organization.hasOutcomes?.find(outcome => outcome.name === object['cids:hasName']);
  if (!outcome) {
    // create the outcome
    outcome = GDBOutcomeModel({
      name: object['cids:hasName'],
      description: object['cids:hasDescription'],
    });
    // build up or modify the theme
    if (object['cids:forTheme']) {
      const theme = (await themeBuilder(object['cids:forTheme'], organization,outcomeDict, themeDict, indicatorDict, trans));
      outcome.theme = `:theme_${theme._id}`;
    }
    // give outcome an id
    await transSave(trans, outcome);

    // build up or modify indicator(s)
    if (object['cids:hasIndicator']) {
      outcome.indicators = [];
      if (Array.isArray(object['cids:hasIndicator'])) {
        outcome.indicators = await Promise.all(object['cids:hasIndicator'].map(indicator =>
          indicatorBuilder(indicator, organization, outcomeDict, themeDict, indicatorDict, trans)));
        // add outcome to each indicators
        await Promise.all(outcome.indicators.map(indicator => {
          if (!indicator.forOutcomes)
            indicator.forOutcomes = [];
          indicator.forOutcomes.push(`:outcome_${outcome._id}`);
          return transSave(trans, indicator);
        }));
      } else {
        //add outcome to the indicator
        const indicator = await indicatorBuilder(object['cids:hasIndicator'], organization, outcomeDict, themeDict, indicatorDict, trans);
        if (!indicator.forOutcomes)
          indicator.forOutcomes = [];
        indicator.forOutcomes.push(`:outcome_${outcome._id}`);
        await transSave(trans, indicator);
        outcome.indicators.push(`:indicator_${indicator._id}`);
      }
    }

    // add organization to the outcome
    outcome.forOrganization = `:organization_${organization._id}`;
  } else {
    throw new Server400Error('The outcome is duplicate');
    // modify the outcome if needed
    if (!outcomeDict[outcome._id]) {
      // name uniquely define outcomes so no need to modify
      // modify description
      outcome.description = object['cids:hasDescription'];
      // modify theme
      if (object['cids:forTheme'])
        outcome.theme = await themeBuilder(object['cids:forTheme'], organization, themeDict, indicatorDict);
      // todo: modify indicators: how to handle list??
    }
  }
  await transSave(trans, outcome);
  outcomeDict[outcome._id] = outcome;
  // add outcome to the organization
  if (!organization.hasOutcomes)
    organization.hasOutcomes = [];
  // todo: maybe have to check if the outcome is in organization already
  organization.hasOutcomes.push(`:outcome_${outcome._id}`);
  return outcome;
}

async function themeBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans) {
  if (!object['tove_org:hasName']) {
    throw new Server400Error('invalid input');
  }
  let theme = await GDBThemeModel.findOne({name: object['tove_org:hasName']});
  if (!theme) {
    // the theme has to be created
    theme = GDBThemeModel({
      name: object['tove_org:hasName'],
      description: object['cids:hasDescription']
    });
  } else {
    throw new Server400Error('The theme is duplicate');
    // the theme has to be modified
    if (!themeDict[theme._id]) {
      // theme name shouldn't be able to be changed
      // theme.name = object['tove_org:hasName'];
      theme.description = object['cids:hasDescription'];
    }
  }
  console.log('before transsave theme')
  await transSave(trans, theme);
  console.log('after transsave the theme')
  themeDict[theme._id] = theme;
  return theme;
}

async function indicatorBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans) {
  if (!object['cids:hasName']) {
    throw new Server400Error('invalid input');
  }
  // assume that the indicator uniquely defines an indicator inside an organization
  let indicator = organization.hasIndicators?.find(indicator => indicator.name === object['cids:hasName']);
  if (!indicator) {
    // an indicator has to be created
    indicator = GDBIndicatorModel({
      name: object['cids:hasName'],
      description: object['cids:hasDescription'],
    });
    indicator.forOrganizations = [`:organization_${organization._id}`];
    if (object['cids:forOutcome']) {
      indicator.forOutcome = [await outcomeBuilder(object['cids:forOutcome'], organization, outcomeDict, themeDict, indicatorDict, trans)];
    }
    // todo: unit of measure, indicator report, outcome

  } else {
    throw new Server400Error('The indicator is duplicate');
    // the indicator has to be modified
    if (!indicatorDict[indicator._id]) {
      indicator.description = object['cids:hasDescription'];
    }
    // todo: unit of measure, indicator report, outcome
  }
  indicatorDict[indicator._id] = indicator;
  await transSave(trans, indicator);
  if (!organization.hasIndicators)
    organization.hasIndicators = [];
  // todo: maybe have to check if the outcome is in organization already
  organization.hasIndicators.push(`:indicator_${indicator._id}`);
  return indicator;
}

async function transSave(trans, object) {
  const {query} = await object.getQueries();
  console.log('query')
  return await trans.update(new UpdateQueryPayload()
    .setQuery(query)
    .setContentType(QueryContentType.SPARQL_UPDATE)
    // .setInference(true)
    .setTimeout(5));
}

const fileUploading = async (req, res, next) => {
  const repo = await getRepository();
  const trans = await repo.beginTransaction();
  try {
    const {objects, organizationId} = req.body;
    const organization = await GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasOutcomes']});
    const outcomeDict = {};
    const themeDict = {};
    const indicatorDict = {};
    if (!organization)
      throw new Server400Error('Wrong organization ID');

    for (let object of objects) {
      switch (object['@type']) {
        case 'cids:Outcome':
          await outcomeBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans);
          break;
        case 'cids:hasIndicator':
          await indicatorBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans);
          break;
        case 'cids:Theme':
          await themeBuilder(object, organization, outcomeDict, themeDict, indicatorDict, trans);
          break;

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