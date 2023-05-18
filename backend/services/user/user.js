const {GDBUserAccountModel} = require("../../models/userAccount");
const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {findOutObjectBeenRemoved, organizationBelongsToUser, findOutObjectbeenAdded} = require("../../helpers");
const {GDBOrganizationModel} = require("../../models/organization");

const fetchUserHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchUser'))
      return await fetchUser(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateUserHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateUser'))
      return await updateUser(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchUser = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    return res.status(400).json({success: false, message: 'URI should be given'});
  const user = await GDBUserAccountModel.findOne({_uri: uri});
  if (!user)
    return res.status(400).json({success: false, message: 'No such user'});
  delete user.salt;
  delete user.hash;
  delete user.securityQuestions;
  return res.status(200).json({success: true, user: user});

};

const updateUser = async (req, res) => {
  const {uri} = req.params;
  const {associatedOrganizations} = req.body;
  if (!uri || ((!associatedOrganizations || !Array.isArray(associatedOrganizations)) && !req.session.isSuperuser))
    throw new Server400Error('Wrong input');
  const user = await GDBUserAccountModel.findOne({_uri: uri});
  if (!user)
    throw new Server400Error('No such user');
  // update associated organizations

  const messageList = [];
  if(associatedOrganizations) {
    // find out organizations were removed
    const removedOrganizationURIs = findOutObjectBeenRemoved(user.associatedOrganizations, associatedOrganizations);
    // check the if the user serves as any role in these organizations
    removedOrganizationURIs.map(organizationURI => {
      // const orgID = organizationURI.split('_')[1];
      if (organizationBelongsToUser(user, organizationURI, 'editorOfs')) {
        // if the user serves as a role in the organization
        messageList.push(`The user is served as an editor in ${organizationURI}`);
      }
      if (organizationBelongsToUser(user, organizationURI, 'reporterOfs')) {
        // if the user serves as a role in the organization
        messageList.push(`The user is served as an reporter in ${organizationURI}`);
      }
      if (organizationBelongsToUser(user, organizationURI, 'researcherOfs')) {
        // if the user serves as a role in the organization
        messageList.push(`The user is served as an researcher in ${organizationURI}`);
      }
      if (organizationBelongsToUser(user, organizationURI, 'administratorOfs')) {
        // if the user serves as a role in the organization
        messageList.push(`The user is served as an administrator in ${organizationURI}`);
      }
    });
    if (messageList.length) {
      return res.status(200).json({success: false, messageList});
    }
    // after checking, start to remove the user from organizations
    const removedOrganizations = await Promise.all(removedOrganizationURIs.map(organizationURI => {
      return GDBOrganizationModel.findOne({_uri: organizationURI});
    }));
    await Promise.all(removedOrganizations.map(organization => {
      const index = organization.hasUsers.indexOf(uri);
      organization.hasUsers.splice(index, 1);
      // save the removed organizations directly
      return organization.save();
    }));

    const addedOrganizationURIs = findOutObjectbeenAdded(user.associatedOrganizations, associatedOrganizations);
    const addedOrganizations = await Promise.all(addedOrganizationURIs.map(organizationURI => {
      return GDBOrganizationModel.findOne({_uri: organizationURI});
    }));
    await Promise.all(addedOrganizations.map(organization => {
      if (!organization.hasUsers)
        organization.hasUsers = [];
      organization.hasUsers.push(uri)
      // save the removed organizations directly
      return organization.save();
    }));
    user.associatedOrganizations = associatedOrganizations
  }

  await user.save();
  return res.status(200).json({success: true});
};

module.exports = {fetchUserHandler, updateUserHandler};