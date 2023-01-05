const {GDBOrganizationModel, GDBOrganizationIdModel} = require("../../models/organization");
const {Server400Error} = require("../../utils");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBDomainModel} = require("../../models/domain");

async function superuserCreateOrganization(req, res, next) {
  try {
    const {form, outcomeForm} = req.body;
    if (!form || !outcomeForm)
      return res.status(400).json({success: false, message: 'Wrong information input'});
    if (!form.legalName)
      return res.status(400).json({success: false, message: 'Legal name is requested'});
    if(!form.ID)
      return res.status(400).json({success: false, message: 'Organization ID is requested'});
    form.hasId = GDBOrganizationIdModel({hasIdentifier: form.ID})
    const organization = GDBOrganizationModel(form);
    for(let i = 0; i < outcomeForm.length; i++){
      const outcome = outcomeForm[i];
      if(!outcome.name || !outcome.description || !outcome.domain)
        return res.status(400).json({success: false, message: 'Wrong information input'});
      const domainObject= await GDBDomainModel.findOne({_id:outcome.domain});
      if(!domainObject)
        return res.status(400).json({success: false, message: 'Wrong domain id'});
      const outcomeObject = GDBOutcomeModel({name: outcome.name, description: outcome.description, domain: domainObject
      });
      if(!organization.hasOutcomes) {
        organization.hasOutcomes = []
      }
      await outcomeObject.save()
      organization.hasOutcomes.push(outcomeObject);
    }

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
    const organization = await GDBOrganizationModel.findOne({_id:id}, {populates: ['hasId', 'hasOutcomes']});
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});
    const outcomes = organization.hasOutcomes || [];
    if(outcomes.length > 0){
      outcomes.map(outcome => {
        outcome.domain = outcome.domain.split('_')[1];
      });
    }
    organization.ID = organization.hasId?.hasIdentifier;
    delete organization.hasOutcomes;
    delete organization.hasId;
    return res.status(200).json({success: true, organization, outcomes});
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
    if (!form.ID)
      return res.status(400).json({success: false, message: 'ID is requested'});
    organization.legalName = form.legalName;
    organization.comment = form.comment;
    organization.administrator = form.administrator;
    organization.reporters = form.reporters;
    organization.editors = form.editors;
    organization.researchers = form.researchers;
    organization.hasId = form.ID;
    await organization.save();
    return res.status(200).json({
      success: true,
      message: 'Successfully updated organization ' + organization.legalName
    });
  } catch (e) {
    next(e);
  }
};

async function adminUpdateOrganization(req, res, next) {
  try {
    const {id} = req.params;
    const form = req.body;

    const sessionId = req.session._id;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    if (!form)
      return res.status(400).json({success: false, message: 'Information is needed'});

    const organization = await GDBOrganizationModel.findOne({_id: id, administrator: {_id: sessionId}});
    if (!organization)
      return res.status(400).json({success: false, message: 'No such organization'});

    // admin shouldn't be able to edit legal name and administrator
    organization.comment = form.comment;
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
  adminUpdateOrganization,
  superuserCreateOrganization,
  superuserFetchOrganization,
  superuserUpdateOrganization,
  superuserDeleteOrganization,
  adminFetchOrganization
};