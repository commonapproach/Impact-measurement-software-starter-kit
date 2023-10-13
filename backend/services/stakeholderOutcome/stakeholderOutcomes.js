const {hasAccess} = require("../../helpers/hasAccess");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");


const fetchStakeholderOutcomesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderOutcomes'))
      return await fetchStakeholderOutcomes(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchStakeholderOutcomes = async (req, res) => {
  const stakeholderOutcomes = await GDBStakeholderOutcomeModel.find({}, {populates:
    ['outcome',
    'codes',
    'impactReports']
})
  return res.status(200).json({success: true, stakeholderOutcomes})

}


module.exports = {fetchStakeholderOutcomesHandler}