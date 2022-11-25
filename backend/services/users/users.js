const {GDBUserAccountModel} = require("../../models/userAccount");
const {userType2UserTypeURI} = require("../../helpers/dicts");
const {GraphDB} = require('../../utils/graphdb')
const {SPARQL} = require('../../utils/graphdb/helpers')
const superUserFetchUsers = async (req, res, next) => {
  const {userType} = req.params;
  if (!userType) {
    const users = await GDBUserAccountModel.find({}, {populates: 'person'});
    return res.status(200).json({data: users, success: true});
  } else {
    if (!userType2UserTypeURI[userType]) {
      return res.status(400).json({success: false, message: 'Wrong userType'});
    }

    const usersWithUsertype = []
    let query = `
        PREFIX : <http://ontology.eil.utoronto.ca/cids/cidsrep#>
        select * where { 
	          ?user :UserType :${userType}.
        }`;
    await GraphDB.sendSelectQuery(query, false, ({user}) => {
      usersWithUsertype.push(SPARQL.getPrefixedURI(user.id) )
    });

    return res.status(200).json({data: usersWithUsertype, success: true});
  }

};

const superuserDeleteUser = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (id === req.session._id)
      return res.status(400).json({success: false, message: 'A user cannot delete itself'});
    await GDBUserAccountModel.findByIdAndDelete(id);
    return res.status(200).json({success: true});
  } catch (e) {
    next(e);
  }
};


module.exports = {superUserFetchUsers, superuserDeleteUser};