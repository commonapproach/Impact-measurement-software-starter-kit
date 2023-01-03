const {GDBDomainModel} = require("../../models/domain");

const fetchDomains = async (req, res, next) => {
  try {
    const domains = await GDBDomainModel.find({});
    return res.status(200).json({success: true, domains})
  } catch (e) {
    next(e);
  }
};

module.exports = {fetchDomains}