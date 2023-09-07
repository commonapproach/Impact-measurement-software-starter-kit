const {baseLevelConfig} = require("./configs");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBIndicatorModel} = require("../../models/indicator");
const {isValidURL} = require("../../helpers/validator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {addMessage} = require("../helpers");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

const graphDBUtilsModelDict = {
  organization: GDBOrganizationModel,
  'cids:Indicator': GDBIndicatorModel,
  'cids:forOutcome': GDBOutcomeModel
};

const getValue = (object, type, property) => {
  const graphdbModel = graphDBUtilsModelDict[type];
  if (object[getFullURI(graphdbModel.schema[property].internalKey)]) {
    return object[getFullURI(graphdbModel.schema[property].internalKey)][0]['@value'];
  } else {
    return undefined;
  }


};

/**
 * return list of object URI
 * @param object
 * @param type
 * @param property
 * @returns {*}
 */
const getListOfValue = (object, type, property) => {
  const graphdbModel = graphDBUtilsModelDict[type];
  const ret = object[getFullURI(graphdbModel.schema[property].internalKey)]?.map(obj => {
    if (isValidURL(obj['@value'])) {
      return obj['@value'];
    } else {
      errorCounter += 1;
      addMessage(8, 'invalidValue',
        {
          uri: object['@id'],
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(GDBOutcomeModel, property)),
          value: obj['@value']
        });
    }

  });
  return ret?.filter(uri => !!uri);
};

async function generalBuilder(trans, object, organization, dicts, errorCounter, messageBuffer) {
  const uri = object['@id'];
  const indicator = dicts.indicator[uri];
  const config = baseLevelConfig['indicator'];

  for (const property of Object.keys(config)) {
    const restriction = config[property].restriction;
    const propertyNameInUtil = config[property].propertyNameInUtil;
    const doubleDirection = config[property].doubleDirection;
    const flag = config[property].flag;
    if (restriction) {
      if (restriction.one) {
        indicator[propertyNameInUtil] = getValue(object, property, propertyNameInUtil);
        if (flag && !indicator[propertyNameInUtil]) {
          // flag need to be raised
          addMessage()
        }
        if (doubleDirection) {
          const ob = await graphDBUtilsModelDict[property].findOne({_uri: indicator[propertyNameInUtil]});
          if (doubleDirection.one) {
            ob[doubleDirection.property] = uri;
          } else {
            if (!ob[doubleDirection.property])
              ob[doubleDirection.property] = [];
            if (!ob[doubleDirection.property].includes(uri))
              ob[doubleDirection.property].push(uri);
          }
        }
      } else {
        indicator[propertyNameInUtil] = getListOfValue(object, property, propertyNameInUtil);
        if (doubleDirection) {
          const obs = await Promise.all(indicator[propertyNameInUtil].map(uri => {
            let ret = dicts[restriction.type][uri]; // if in the file
            if (!ret) {
              ret = graphDBUtilsModelDict[property].findOne({_uri: uri});
            }
            return ret;
          }));
          if (doubleDirection.one) {
            obs.map(ob => {
              ob[doubleDirection.property] = uri;
            });
          } else {
            obs.map(ob => {
                if (!ob[doubleDirection.property])
                  ob[doubleDirection.property] = [];
                if (!ob[doubleDirection.property].includes(uri))
                  ob[doubleDirection.property].push(uri);
              }
            );
          }
        }
      }

    }
  }
}


module.exports = {};