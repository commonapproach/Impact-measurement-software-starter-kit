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
      return res.status(400).json({success: false, message: 'Id is needed'});
    const organization = await GDBOrganizationModel.findById(id);
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});
    return res.status(200).json({success: true, organization: organization});
  } catch (e) {
    next(e);
  }
}

async function superuserUpdateOrganization(req, res, next){
  try {
    const {id} = req.params;
    const form = req.body;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    if (!form)
      return res.status(400).json({success: false, message: 'Information is needed'});

    const organization = await GDBOrganizationModel.findById(id);
    if(!organization)
      return res.status(400).json({success: false, message: 'No such organization'});

    if(!form.legalName)
      return res.status(400).json({success: false, message: 'Legal name is requested'});
    organization.legalName = form.legalName;
    organization.comment = form.comment;
    organization.administrators = form.administrators;
    organization.reporters = form.reporters;
    organization.editors = form.editors;
    organization.researchers = form.researchers;
    await organization.save();
    return res.status(200).json({success: true, message: 'Successfully updated organization ' + organization.legalName})
  }catch (e) {
    next(e)
  }
}

module.exports = {superuserCreateOrganization, superuserFetchOrganization, superuserUpdateOrganization};