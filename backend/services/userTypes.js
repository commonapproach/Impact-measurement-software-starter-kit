const {userTypeURI2UserType} = require("../helpers/dicts");

async function fetchUserTypes(req, res, next){
  try {
    const userTypes = userTypeURI2UserType;
    return res.status(200).json({userTypes});
  } catch (e){
    next(e);
  }
}

module.exports = {fetchUserTypes}