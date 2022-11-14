const {userType2UserTypeURI} = require("../helpers/dicts");

async function fetchUserTypes(req, res, next){
  try {
    const userTypes = Object.keys(userType2UserTypeURI);
    return res.status(200).json({userTypes});
  } catch (e){
    next(e);
  }
}

module.exports = {fetchUserTypes}