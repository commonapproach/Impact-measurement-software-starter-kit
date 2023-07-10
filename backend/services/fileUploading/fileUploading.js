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
    let traceOfUploading = '';
    let error = 0;

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
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))} is missing`);
          error += 1;
          hasError = true;
        } else {
          outcome.themes = getListOfValue(object, GDBOutcomeModel, 'themes');
        }


        // add indicator to outcome
        if (!object[getFullPropertyURI(GDBOutcomeModel, 'indicators')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'indicators'))} is missing`);
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
                error += 1;
                hasError = true;
              } else if (!indicator.forOrganizations.includes(organization._uri)) {
                addTrace('        Error:');
                addTrace(`            Outcome ${indicatorURI} does not belong to this organization`);
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
                error += 1;
              }else if (outcome.forOrganization !== organization._uri) {
                // check if the outcome belongs to the organization
                addTrace('        Error:');
                addTrace(`            Outcome ${outcomeURI} doesn't belong to this organization`);
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
            error += 1;
          }else if (!indicator.forOrganizations.includes(organization._uri)) {
            addTrace('        Error:');
            addTrace(`            Indicator ${indicatorURI} doesn't belong to this organization`);
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
          addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`)
        }
      } else {
        // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
      }

    }

    const {objects, organizationUri, fileName} = req.body;
    addTrace(`Loading file ${fileName}...`);
    if (!Array.isArray(objects)) {
      // the object should be an array
      addTrace('Error');
      addTrace('The file should contain a list of json objects.');
      addTrace('Please consult the JSON-LD reference at: https://json-ld.org/')
      error += 1;
      throw new Server400Error(traceOfUploading);
    }
    if (!objects.length) {
      // the objects shouldn't be empty
      addTrace('Warning!');
      addTrace('The file is empty');
      addTrace('There is nothing to upload ');
      error += 1;
      throw new Server400Error(traceOfUploading);
    }
    addTrace('    Adding objects to organization with URI: ' + organizationUri);
    addTrace('');

    const expandedObjects = await expand(objects);

    if (!expandedObjects.length) {
      addTrace('        Warning!');
      // addTrace('Got an empty list from json-ld expanded function...');
      addTrace('            Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. ' +
        'Some objects must have a @context');
      addTrace('            Read more about JSON-LD  at: https://json-ld.org/');
      addTrace('            Nothing was uploaded');
      error += 1;
      throw new Server400Error(traceOfUploading);
    }


    const organization = await GDBOrganizationModel.findOne({_uri: organizationUri}, {populates: ['hasOutcomes']});
    if (!organization) {
      addTrace('        Error: Incorrect organization URI: No such Organization');
      addTrace('            The fail failed to upload');
      throw new Server400Error(traceOfUploading);
    }

    for (let object of expandedObjects) {
      // store the raw object into objectDict
      const uri = object['@id'];
      if (!isValidURL(uri)){
        error += 1;
        addTrace('        Error: Invalid URI');
        addTrace(`            In object with URI ${object['@id']} of type ${getPrefixedURI(object['@type'][0])} attribute ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'themes'))}  contains invalid value(s): ${obj['@value']}`);
        continue;
      }
      if (objectDict[uri]){
        // duplicated uri
        error += 1;
        addTrace('        Error: Duplicated URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}, its URI is duplicated`);
        continue;
      }
      objectDict[uri] = object;
      // assign the object an id and store them into specific dict
      let hasError = false;
      if (object['@type'].includes(getFullTypeURI(GDBOutcomeModel))) { // todo: here don't have to be hardcoded

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);

        if (!object[getFullPropertyURI(GDBOutcomeModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'name'))} is missing`);
          error += 1;
          hasError = true;
        }
        if (!object[getFullPropertyURI(GDBOutcomeModel, 'description')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, 'description'))} is missing`);
          error += 1;
          hasError = true;
        }
        if (!hasError) {
          const outcome = GDBOutcomeModel({
            name: getValue(object, GDBOutcomeModel, 'name'),
            description: getValue(object, GDBOutcomeModel, 'description'),
          }, {uri: uri});
          await transSave(trans, outcome);
          outcomeDict[uri] = outcome;
        }
      } else if (object['@type'].includes(getFullTypeURI(GDBIndicatorModel))) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);

        if (!object[getFullPropertyURI(GDBIndicatorModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'name'))} is missing`);
          error += 1;
          hasError = true;
        }

        if (!object[getFullPropertyURI(GDBIndicatorModel, 'description')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'description'))} is missing`);
          error += 1;
          hasError = true;
        }

        if (!object[getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorModel, 'unitOfMeasure'))} is missing`);
          error += 1;
          hasError = true;
        }

        // if there is error on building up indicator
        if (!hasError) {
          const indicator = GDBIndicatorModel({
            name: getValue(object, GDBIndicatorModel, 'name'),
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

        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'name'))} is missing`);
          error += 1;
          hasError = true;
        }
        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'dateCreated'))} is missing`);
          error += 1;
          hasError = true;
        }
        if (!object[getFullPropertyURI(GDBIndicatorReportModel, 'comment')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBIndicatorReportModel, 'comment'))} is missing`);
          error += 1;
          hasError = true;
        }
        if (!hasError) {
          const indicatorReport = GDBIndicatorReportModel({
            name: getValue(object, GDBIndicatorReportModel, 'name'),
            dateCreated: new Date(getValue(object, GDBIndicatorReportModel, 'dateCreated')),
            comment: getValue(object, GDBIndicatorReportModel, 'comment'),

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

        if (!object[getFullPropertyURI(GDBThemeModel, 'name')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'name'))} is missing`);
          error += 1;
          hasError = true;
        }
        if (!object[getFullPropertyURI(GDBThemeModel, 'description')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBThemeModel, 'description'))} is missing`);
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

        if (!object[getFullPropertyURI(GDBUnitOfMeasure, 'label')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))} is missing`);
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

        if (!object[getFullPropertyURI(GDBMeasureModel, 'numericalValue')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} ${getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'numericalValue'))} is missing`);
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

        if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')] ||
          !object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} hasBeginning and hasEnd is mandatory`);
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
            error += 1;
          } else {
            addTrace(`        Warning: organization object is ignored`);
            addTrace(`            Organization information can only be updated through the interface`);
          }

      } else {
        addTrace('        Warning!');
        addTrace(`            Object with URI ${uri} is being ignored: The object type is not supported`);
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
      await trans.commit();
      addTrace(`Completed loading ${fileName}`);
    } else {
      addTrace(`${error} error(s) found`);
      addTrace(`File failed to upload`);
    }

    if (!error) {
      return res.status(200).json({success: true, traceOfUploading});
    } else {
      await trans.rollback();
      throw new Server400Error(traceOfUploading);
    }

  } catch (e) {
    if (trans.active)
      await trans.rollback();
    next(e);
  }
};

module.exports = {fileUploadingHandler};