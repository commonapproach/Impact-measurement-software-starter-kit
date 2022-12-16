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

const adminFetchOrganizations = async (req, res, next) => {
  try{
    const sessionId = req.session._id;
    const organizations = await GDBOrganizationModel.find({administrator: {_id: sessionId}});
    return res.status(200).json({success: true, organizations})
  } catch (e) {
    next(e);
  }
};

module.exports = {adminFetchOrganizations, superuserFetchOrganizations, groupAdminFetchOrganizations, adminFetchOrganizations};