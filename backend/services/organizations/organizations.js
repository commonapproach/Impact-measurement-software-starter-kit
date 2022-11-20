const {GDBOrganizationModel} = require("../../models/organization");
const fetchOrganizations = async (req, res, next) => {
  try {
    const organizations = await GDBOrganizationModel.find({});
    return res.status(200).json({success: true, organizations: organizations});
  }catch (e) {
    next(e);
  }
}

module.exports = {fetchOrganizations}