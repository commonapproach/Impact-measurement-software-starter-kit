const {GDBThemeModel} = require("../../models/theme");
const {hasAccess} = require("../../helpers/hasAccess");

const createTheme = async (req, res) => {

    const form = req.body;
    if (!form.name || !form.description || !form.identifier)
      return res.status(400).json({success: false, message: 'Name and description are needed'});
    if (await GDBThemeModel.findOne({hasIdentifier: form.identifier}))
      return res.status(400).json({success: false, message: 'Duplicated Identifier'})
  form.hasIdentifier = form.identifier;
    const theme = GDBThemeModel(form);
    await theme.save();
    return res.status(200).json({success: true, message: 'Successfully created the theme'});

};

const fetchTheme = async (req, res) => {
  const {id} = req.params;
  if (!id)
    return res.status(400).json({success: false, message: 'Id is needed'});
  const theme = await GDBThemeModel.findOne({_id: id});
  if (!theme)
    return res.status(400).json({success: false, message: 'No such theme'});
  theme.identifier = theme.hasIdentifier;
  return res.status(200).json({success: true, theme});
};

const updateTheme = async (req, res) => {
  const {id} = req.params;
  const form = req.body;
  if (!id)
    return res.status(400).json({success: false, message: 'Id is needed'});
  const theme = await GDBThemeModel.findOne({_id: id});
  if (!theme)
    return res.status(400).json({success: false, message: 'No such theme'});
  if (!form.name || !form.description || !form.identifier)
    return res.status(400).json({success: false, message: 'Invalid input'});
  theme.name = form.name;
  theme.description = form.description;
  if (theme.hasIdentifier !== form.identifier) {
    if (await GDBThemeModel.findOne({hasIdentifier: form.identifier}))
      return res.status(400).json({success: false, message: 'Duplicated Identifier'});
    theme.hasIdentifier = form.identifier;
  }
  await theme.save();
  return res.status(200).json({success: true, message: 'Successfully update the theme'});
};

const deleteTheme = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Id is needed'});
    await GDBThemeModel.findAndDelete({_id: id});
    return res.status(200).json({success: true});
  } catch (e) {
    next(e);
  }
};

const createThemeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createTheme'))
      return await createTheme(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchThemeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchTheme'))
      return await fetchTheme(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateThemeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateTheme'))
      return await updateTheme(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};


module.exports = {createThemeHandler, fetchThemeHandler, deleteTheme, updateThemeHandler};