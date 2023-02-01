const {GDBDomainModel} = require("../../models/domain");
const {hasAccess} = require("../../helpers");

const createDomain = async (req, res) => {

    const form = req.body;
    if (!form.name || !form.description)
      return res.status(400).json({success: false, message: 'Name and description are needed'});
    const domain = GDBDomainModel(form);
    await domain.save();
    return res.status(200).json({success: true, message: 'Successfully created the domain'});

};

const fetchDomain = async (req, res) => {
  const {id} = req.params;
  if (!id)
    return res.status(400).json({success: false, message: 'Id is needed'});
  const domain = await GDBDomainModel.findOne({_id: id});
  if (!domain)
    return res.status(400).json({success: false, message: 'No such domain'});
  return res.status(200).json({success: true, domain});
};

const updateDomain = async (req, res) => {
  const {id} = req.params;
  const form = req.body;
  if (!id)
    return res.status(400).json({success: false, message: 'Id is needed'});
  const domain = await GDBDomainModel.findOne({_id: id});
  if (!domain)
    return res.status(400).json({success: false, message: 'No such domain'});
  domain.name = form.name;
  domain.description = form.description;
  await domain.save();
  return res.status(200).json({success: true, message: 'Successfully update the domain'});
};

const deleteDomain = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    await GDBDomainModel.findAndDelete({_id: id});
    return res.status(200).json({success: true});
  } catch (e) {
    next(e);
  }
};

const createDomainHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createDomain'))
      return await createDomain(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchDomainHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchDomain'))
      return await fetchDomain(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateDomainHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateDomain'))
      return await updateDomain(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};


module.exports = {createDomainHandler, fetchDomainHandler, deleteDomain, updateDomainHandler};