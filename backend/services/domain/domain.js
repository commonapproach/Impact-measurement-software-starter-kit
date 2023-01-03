const {GDBDomainModel} = require("../../models/domain");

const createDomain = async (req, res, next) => {
  try {
    const form = req.body;
    if (!form.name || !form.description)
      return res.status(400).json({success: false, message: 'Name and description are needed'});
    const domain = GDBDomainModel(form);
    await domain.save();
    return res.status(200).json({success: true, message: 'Successfully created the domain'});
  } catch (e) {
    next(e);
  }
};


module.exports = {createDomain};