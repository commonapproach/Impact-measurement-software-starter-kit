
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBCodeModel} = require("../../models/code");


const fetchCodes = async (req, res) => {
  const codes = await GDBCodeModel.find({});
  return res.status(200).json({success: true, codes});
};

const fetchCodesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchCodes'))
      return await fetchCodes(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {
  fetchCodesHandler
}