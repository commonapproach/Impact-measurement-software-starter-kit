const {baseLevelConfig} = require("./configs");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBIndicatorModel} = require("../../models/indicator");

const {getFullURI, getPrefixedURI, getObjectValue} = require('graphdb-utils').SPARQL;

async function outcomeBuilder(trans, object, organization, error, {outcomeDict, objectDict}, {addMessage, addTrace, transSave, getFullPropertyURI, getValue, getListOfValue}) {
  const uri = object['@id'];
  const outcome = outcomeDict[uri];
  const config = baseLevelConfig['outcome'];
  let hasError = false;
  if (outcome) {
    if (object[getFullPropertyURI(GDBOutcomeModel, 'name')]) {
      outcome.hasName = getValue(object, GDBOutcomeModel, 'name');
    }
    if (!outcome.hasName && config["cids:hasName"]) {
      if (config["cids:hasName"].rejectFile)
        error += 1;
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'hasName'))
        },
        config["cids:hasName"]
      );

    }

    if (object[getFullPropertyURI(GDBOutcomeModel, 'description')]) {
      outcome.hasName = getValue(object, GDBOutcomeModel, 'description');
    }
    if (!outcome.description && config["cids:hasDescription"]) {

      if (config["cids:hasDescription"].rejectFile)
        error += 1;
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'description'))
        },
        config["cids:hasDescription"]
      );

    }


    // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
    // add the organization to it, and add it to the organization
    outcome.forOrganization = organization._uri;
    if (!organization.hasOutcomes)
      organization.hasOutcomes = [];
    organization.hasOutcomes.push(outcome._uri);

    // add theme to outcome
    if (object[getFullPropertyURI(GDBOutcomeModel, 'themes')]) {
      outcome.themes = getListOfValue(object, GDBOutcomeModel, 'themes');
    }
    if ((!outcome.themes || !outcome.themes.length) && config['cids:forTheme']) {
      if (config['cids:forTheme'].rejectFile)
        error += 1;
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))
        },
        config["cids:forTheme"]
      );
    }


    // if (!object[getFullPropertyURI(GDBOutcomeModel, 'themes')]) {
    //   // addTrace('        Error: Mandatory property missing');
    //   // addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))} is missing`);
    //   // addMessage(8, 'propertyMissing', {uri, type: getPrefixedURI(object['@type'][0]), property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))});
    //   // error += 1;
    //   // hasError = true;
    // } else {
    //   outcome.themes = getListOfValue(object, GDBOutcomeModel, 'themes');
    // }


    // add indicator to outcome
    if (!object[getFullPropertyURI(GDBOutcomeModel, 'indicators')] && config['cids:hasIndicator']) {
      if (config['cids:hasIndicator'].rejectFile)
        error += 1;
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'indicators'))
        },
        config['cids:hasIndicator']
      );
    } else if (object[getFullPropertyURI(GDBOutcomeModel, 'indicators')]) {
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
              {uri, referenceURI: indicatorURI, type: 'Indicator'}, {rejectFile: true});
            error += 1;
          } else if (!indicator.forOrganization !== organization._uri) {
            addTrace('        Error:');
            addTrace(`            Indicator ${indicatorURI} does not belong to this organization`);
            addMessage(8, 'subjectDoesNotBelong', {
              uri,
              type: 'Indicator',
              subjectURI: indicatorURI
            }, {rejectFile: true});
            error += 1;
          } else {
            if (!indicator.forOutcomes)
              indicator.forOutcomes = [];
            indicator.forOutcomes.push(uri);
            await transSave(trans, indicator);
          }

        } // if the indicator is in the file, don't have to worry about adding the outcome to the indicator
      }
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
  return error;

}

module.exports = {outcomeBuilder}