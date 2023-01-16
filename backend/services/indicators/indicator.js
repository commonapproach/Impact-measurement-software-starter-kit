const {json} = require("express");
const {GDBOrganizationModel} = require("../../models/organization");
const fetchIndicators = async (req, res, next) => {
  try {
    const {organizationId} = req.params;
    if(!organizationId)
      return res.status(400).json({success: false, message: 'organizationId is needed'});
    const organization = await GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasIndicators']});
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});
    if(!organization.hasIndacators)
      return res.status(200).json({success: true, indicators: []});
    return res.status(200).json({success: true, indicators: organization.hasIndacators});
  } catch (e) {
    next(e);
  }
}


module.exports = {fetchIndicators}