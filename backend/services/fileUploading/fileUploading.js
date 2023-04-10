const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBThemeModel} = require("../../models/theme");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");

const fileUploadingHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fileUploading'))
      return await fileUploading(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

async function outcomeBuilder(object, organization, outcomeDict, themeDict, indicatorDict) {
  if (!object['cids:hasDescription'] || !object['cids:hasName'] || !object['sch:dateCreated'] || !object['cids:forTheme']) {
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
      outcome.theme = await themeBuilder(object['cids:forTheme'], organization, themeDict, indicatorDict);
    }

    // build up or modify indicator(s)
    if (object['cids:hasIndicator']) {
      outcome.indicators = [];
      if (Array.isArray(object['cids:hasIndicator'])) {
        outcome.indicators = await Promise.all(object['cids:hasIndicator'].map(indicator =>
          indicatorBuilder(indicator, organization, outcomeDict, themeDict, indicatorDict)));
        // add outcome to each indicators
        await Promise.all(outcome.indicators.map(indicator => {
          if (!indicator.forOutcomes)
            indicator.forOutcomes = [];
          indicator.forOutcomes.push(outcome);
          return indicator.save();
        }))
      } else {
        //add outcome to the indicator
        const indicator = await indicatorBuilder(object['cids:hasIndicator'], organization, outcomeDict, themeDict, indicatorDict);
        if (!indicator.forOutcomes)
          indicator.forOutcomes = [];
        indicator.forOutcomes.push(outcome);
        await indicator.save();
        outcome.indicators.push(`:indicator_${indicator._id}`);
      }
    }

    // add organization to the outcome
    outcome.forOrganization = `:organization_${organization._id}`;
  } else {
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
  await outcome.save();
  outcomeDict[outcome._id] = outcome;
  // add outcome to the organization
  if (!organization.hasOutcomes)
    organization.hasOutcomes = [];
  // todo: maybe have to check if the outcome is in organization already
  organization.hasOutcomes.push(`:outcome_${outcome._id}`);
  return outcome;
}

async function themeBuilder(object, organization, outcomeDict, themeDict, indicatorDict) {
  if (!object['cids:hasDescription'] || !object['tove_org:hasName']) {
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
    // the theme has to be modified
    if (!themeDict[theme._id]) {
      // theme name shouldn't be able to be changed
      // theme.name = object['tove_org:hasName'];
      theme.description = object['cids:hasDescription'];
    }
  }
  await theme.save();
  themeDict[theme._id] = theme;
  return theme;
}

async function indicatorBuilder(object, organization, outcomeDict, themeDict, indicatorDict) {
  if (!object['cids:hasName'] || !object['cids:hasDescription']) {
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

    // todo: unit of measure, indicator report, outcome

  } else {
    // the indicator has to be modified
    if (!indicatorDict[indicator._id]) {
      indicator.description = object['cids:hasDescription'];
    }
    // todo: unit of measure, indicator report, outcome
  }
  indicatorDict[indicator._id] = indicator;
  await indicator.save();
  if (!organization.hasIndicators)
    organization.hasIndicators = [];
  // todo: maybe have to check if the outcome is in organization already
  organization.hasIndicators.push(`:indicator_${indicator._id}`);
  return indicator;
}

const fileUploading = async (req, res) => {
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
        await outcomeBuilder(object, organization, outcomeDict, themeDict, indicatorDict);
        break;
    }
  }
  await organization.save();
  return res.status(200).json({success: true});
};

module.exports = {fileUploadingHandler};