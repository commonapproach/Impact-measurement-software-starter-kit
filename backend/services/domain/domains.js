const {GDBDomainModel} = require("../../models/domain");
const {hasAccess} = require("../../helpers/hasAccess");

const fetchDomains = async (req, res) => {
    const domains = await GDBDomainModel.find({});
    return res.status(200).json({success: true, domains})
};

const fetchDomainsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchDomains'))
      return await fetchDomains(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {fetchDomainsHandler}