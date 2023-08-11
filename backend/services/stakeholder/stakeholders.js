const {hasAccess} = require("../../helpers/hasAccess");
const {GDBStakeholderOrganizationModel} = require("../../models/organization");
const {GDBUserAccountModel} = require("../../models/userAccount");

const fetchStakeholdersHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholders'))
      return await fetchStakeholders(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

async function fetchStakeholders(req, res) {
  const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
  if (userAccount.isSuperuser) {
    const stakeholderOrganizations = await GDBStakeholderOrganizationModel.find({});
    stakeholderOrganizations.map(stakeholder => {
      stakeholder.editable = true;
    })
    const stakeholders = stakeholderOrganizations
    return res.status(200).json({success: true, stakeholders});
  }

}

module.exports = {
  fetchStakeholdersHandler
}