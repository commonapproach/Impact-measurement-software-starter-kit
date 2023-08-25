const {baseLevelConfig} = require("./configs");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBIndicatorModel} = require("../../models/indicator");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

const graphDBUtilsModelDict = {
  organization: GDBOrganizationModel,
  'cids:Indicator': GDBIndicatorModel
}

const getValue = (object, type, property) => {
  graphdbModel = graphDBUtilsModelDict[type]
  if (object[getFullURI(graphdbModel.schema[property].internalKey)]){
    return object[getFullURI(graphdbModel.schema[property].internalKey)][0]['@value'];
  } else {
    return undefined;
  }
};

async function indicatorBuilder(trans, object, organization, dicts){
  const uri = object['@id'];
  const indicator = dicts.indicatorDict[uri];
  const config = baseLevelConfig['indicator'];

  for (const property of Object.keys(config)) {
    const restriction = config[property].restriction
    const propertyNameInUtil = config[property].propertyNameInUtil
    const doubleDirection = config[property].doubleDirection;
    if (restriction) {
      if (restriction.one) {
        indicator[propertyNameInUtil] = getValue(object, property, propertyNameInUtil);
        if (doubleDirection) {
          if (!doubleDirection.one) {
            const ob = await graphDBUtilsModelDict[propertyNameInUtil].findOne({_uri: indicator[propertyNameInUtil]});
            if (!ob[doubleDirection.property])
              ob[doubleDirection.property] = []
            ob[doubleDirection.property].push(uri);
          } else {

          }
        }
      } else {

      }
    }
  }
}


module.exports = {indicatorBuilder}