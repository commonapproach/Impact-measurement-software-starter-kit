
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBCharacteristicModel} = require("../../models/characteristic");


const fetchCharacteristics = async (req, res) => {
  const characteristics = await GDBCharacteristicModel.find({});
  return res.status(200).json({success: true, characteristics});
};

const fetchCharacteristicsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchCharacteristics'))
      return await fetchCharacteristics(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {
  fetchCharacteristicsHandler
}