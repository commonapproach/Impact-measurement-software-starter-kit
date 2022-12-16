const {GDBOrganizationModel} = require("../../models/organization");
const superuserFetchOrganizations = async (req, res, next) => {
  try {
    const organizations = await GDBOrganizationModel.find({});
    return res.status(200).json({success: true, organizations: organizations});
  } catch (e) {
    next(e);
  }
};
const groupAdminFetchOrganizations = superuserFetchOrganizations;

module.exports = {superuserFetchOrganizations, groupAdminFetchOrganizations};