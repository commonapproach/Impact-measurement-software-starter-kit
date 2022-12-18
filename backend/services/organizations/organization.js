const {GDBOrganizationModel} = require("../../models/organization");

async function superuserCreateOrganization(req, res, next) {
  try {
    const form = req.body;
    if (!form)
      return res.status(400).json({success: false, message: 'Wrong information input'});
    if (!form.legalName)
      return res.status(400).json({success: false, message: 'Legal name is requested'});
    const organization = GDBOrganizationModel(form);
    await organization.save();
    return res.status(200).json({success: true, message: 'Successfully create organization ' + organization.legalName});
  } catch (e) {
    next(e);
  }
}

async function superuserFetchOrganization(req, res, next) {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Organization ID is needed'});
    const organization = await GDBOrganizationModel.findById(id);
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});
    return res.status(200).json({success: true, organization: organization});
  } catch (e) {
    next(e);
  }
}

async function adminFetchOrganization(req, res, next) {
  try {
    const {id} = req.params;
    const sessionId = req.session._id;
    if (!id)
      return res.status(400).json({success: false, message: 'Organization ID is needed'});
    const organization = await GDBOrganizationModel.findOne({_id: id}, {populates: ['administrator']});
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});
    if(organization.administrator._id !== sessionId)
      return res.status(400).json({success: false, message: 'The user is not the admin of the organization'});
    organization.administrator = `:userAccount_${organization.administrator._id}`;
    return res.status(200).json({success: true, organization: organization});
  }catch (e) {
    next(e);
  }
}

async function superuserUpdateOrganization(req, res, next) {
  try {
    const {id} = req.params;
    const form = req.body;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    if (!form)
      return res.status(400).json({success: false, message: 'Information is needed'});

    const organization = await GDBOrganizationModel.findById(id);
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});

    if (!form.legalName)
      return res.status(400).json({success: false, message: 'Legal name is requested'});
    organization.legalName = form.legalName;
    organization.comment = form.comment;
    organization.administrator = form.administrator;
    organization.reporters = form.reporters;
    organization.editors = form.editors;
    organization.researchers = form.researchers;
    await organization.save();
    return res.status(200).json({
      success: true,
      message: 'Successfully updated organization ' + organization.legalName
    });
  } catch (e) {
    next(e);
  }
}

async function superuserDeleteOrganization(req, res, next) {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    const organization = await GDBOrganizationModel.findByIdAndDelete(id);
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});
    return res.status(200).json({success: true, message: 'Successfully deleted ' + organization.legalName});
  } catch (e) {
    next(e);
  }
}

module.exports = {
  superuserCreateOrganization,
  superuserFetchOrganization,
  superuserUpdateOrganization,
  superuserDeleteOrganization,
  adminFetchOrganization
};