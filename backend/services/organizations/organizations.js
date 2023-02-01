const {GDBOrganizationModel} = require("../../models/organization");
const {hasAccess} = require("../../helpers");

const fetchOrganizationsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchOrganizations'))
      return await fetchOrganizations(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchOrganizations = async (req, res) => {
  let organizations;

  if (req.session.isSuperuser) {
    organizations = await GDBOrganizationModel.find({});
    return res.status(200).json({success: true, organizations: organizations});
  }

  return res.status(200).json({success: true, organizations: organizations});

};
// const groupAdminFetchOrganizations = superuserFetchOrganizations;

const adminFetchOrganizations = async (req, res, next) => {

  const sessionId = req.session._id;
  const organizations = await GDBOrganizationModel.find({administrator: {_id: sessionId}});
  return res.status(200).json({success: true, organizations});

};

module.exports = {
  adminFetchOrganizations,
  fetchOrganizationsHandler,
  adminFetchOrganizations
};