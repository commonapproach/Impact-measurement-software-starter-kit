const {baseLevelConfig} = require("../fileUploading/configs");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBIndicatorModel} = require("../../models/indicator");
const {Server400Error} = require("../../utils");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {GDBThemeModel} = require("../../models/theme");

const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function outcomeBuilder(environment, trans, object, organization, impactNorms, error, {outcomeDict, objectDict}, {
  addMessage,
  addTrace,
  transSave,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object? object['@id'] : undefined;
  const outcome = environment === 'fileUploading' ? outcomeDict[uri] : GDBOutcomeModel({
    name: form.name
  }, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, outcome);
    uri = outcome._uri;
  }

  const config = baseLevelConfig['outcome'];
  let hasError = false;
  if (outcome) {
    if ((object && object[getFullPropertyURI(GDBOutcomeModel, 'name')]) || form.name) {
      outcome.name = environment === 'fileUploading' ? getValue(object, GDBOutcomeModel, 'name') : form.name;
    }
    if (!outcome.name && config["cids:hasName"]) {
      if (config["cids:hasName"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Name is mandatory');
        }
      }

      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'hasName'))
          },
          config["cids:hasName"]
        );

    }

    if ((object && object[getFullPropertyURI(GDBOutcomeModel, 'description')]) || form.description) {
      outcome.description = getValue(object, GDBOutcomeModel, 'description') || form.description;
    }
    if (!outcome.description && config["cids:hasDescription"]) {
      if (config["cids:hasDescription"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Description is Mandatory');
        }

      }
      if (environment === 'fileUploading')
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
    if (environment !== 'fileUploading') {
      organization = await GDBOrganizationModel.findOne({_uri: form.organization});
      impactNorms = await GDBImpactNormsModel.findOne({organization: form.organization}) || GDBImpactNormsModel({organization: form.organization})
    }
    outcome.forOrganization = organization._uri;
    if (!impactNorms.outcomes)
      impactNorms.outcomes = []
    impactNorms.outcomes.push(uri);


    if (!organization.hasOutcomes)
      organization.hasOutcomes = [];
    organization.hasOutcomes.push(uri);

    // add theme to outcome
    if ((object && object[getFullPropertyURI(GDBOutcomeModel, 'themes')]) || form?.themes) {
      outcome.themes = environment === 'fileUploading' ? getListOfValue(object, GDBOutcomeModel, 'themes') : form.themes;
    }
    if ((!outcome.themes || !outcome.themes.length) && config['cids:forTheme']) {
      if (config['cids:forTheme'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Themes are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))
          },
          config["cids:forTheme"]
        );
    }

    // codes
    if ((outcome.codes || !outcome.codes.length) && config['cids:hasCode']) {
      if (config['cids:hasCode'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Codes are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'codes'))
          },
          config['cids:hasCode']
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
    if (((environment === 'fileUploading' && !object[getFullPropertyURI(GDBOutcomeModel, 'indicators')]) || (environment !== 'fileUploading' && (!form.indicators || !form.indicators.length))) && config['cids:hasIndicator']) {
      if (config['cids:hasIndicator'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Indicators are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'indicators'))
          },
          config['cids:hasIndicator']
        );
    } else if ((object && object[getFullPropertyURI(GDBOutcomeModel, 'indicators')]) || (form.indicators)) {
      if (!outcome.indicators)
        outcome.indicators = [];
      for (const indicatorURI of environment === 'fileUploading'? getListOfValue(object, GDBOutcomeModel, 'indicators') : form.indicators) {
        outcome.indicators.push(indicatorURI);
        // add outcome to indicator
        if (environment !== 'fileUploading' || !objectDict[indicatorURI]) {
          //in this case, the indicator is not in the file, get the indicator from database and add the outcome to it
          const indicator = await GDBIndicatorModel.findOne({_uri: indicatorURI});
          if (!indicator) {
            if (environment === 'fileUploading') {
              addTrace('        Error: bad reference');
              addTrace(`            Indicator ${indicatorURI} appears neither in the file nor in the sandbox`);
              addMessage(8, 'badReference',
                {uri, referenceURI: indicatorURI, type: 'Indicator'}, {rejectFile: true});
              hasError = true;
              error += 1;
            } else {
              throw new Server400Error(`Indicator ${indicatorURI} is not in the database`)
            }

          } else if (indicator.forOrganization !== organization._uri) {
            if (environment === 'fileUploading') {
              addTrace('        Error:');
              addTrace(`            Indicator ${indicatorURI} does not belong to this organization`);
              addMessage(8, 'subjectDoesNotBelong', {
                uri,
                type: 'Indicator',
                subjectURI: indicatorURI
              }, {rejectFile: true});
              error += 1;
              hasError = true;
            } else {
              throw new Server400Error(`Indicator ${indicatorURI} does not belong to this organization`)
            }
          } else {
            if (!indicator.forOutcomes)
              indicator.forOutcomes = [];
            indicator.forOutcomes.push(uri);
            await transSave(trans, indicator);
          }

        } // if the indicator is in the file, don't have to worry about adding the outcome to the indicator
      }
    }
    if (environment === 'interface') {
      await transSave(trans, organization);
      await transSave(trans, outcome);
      await transSave(trans, impactNorms);
    }
    if (hasError) {
      // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
    } else if (environment === 'fileUploading'){
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }

  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

module.exports = {outcomeBuilder};