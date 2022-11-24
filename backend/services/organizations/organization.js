const {GDBOrganizationModel} = require("../../models/organization");

async function createOrganization(req, res, next){
  try{
    const form = req.body;
    if(!form)
      return res.status(400).json({success: false, message: 'Wrong information input'});
    if(!form.legalName)
      return res.status(400).json({success: false, message: 'Legal name is needed'});
    const organization = GDBOrganizationModel(form);
    await organization.save();
    return res.status(200).json({success: true, message: 'Successfully create organization ' + organization.legalName})
  }catch (e) {
    next(e);
  }
}

module.exports = {createOrganization}