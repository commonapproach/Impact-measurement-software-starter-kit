const {GDBThemeModel} = require("../../models/theme");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOutcomeModel} = require("../../models/outcome");

const fetchThemes = async (req, res) => {
    const themes = await GDBThemeModel.find({});
    return res.status(200).json({success: true, themes});
};

const fetchThemesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchThemes'))
      return await fetchThemes(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {fetchThemesHandler};