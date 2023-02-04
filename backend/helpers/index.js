const {GDBOrganizationModel} = require("../models/organization");
const {Server400Error} = require("../utils");
const {GDBGroupModel} = require("../models/group");
const {GDBIndicatorModel} = require("../models/indicator");
const {GDBUserAccountModel} = require("../models/userAccount");

function URI2Id(uri) {
  return uri.split('_')[1];
}

/**
 * the function checks weather the user is serving for the organization as a specific role
 * @param userAccount user's userAccount
 * @param organizationId organization's id
 * @param role role of the user, ex. 'administratorOfs'
 */
function organizationBelongsToUser(userAccount, organizationId, role) {
  const checkerList = userAccount[role].filter(organizationURL =>
    organizationURL.split('_')[1] === organizationId
  );
  return checkerList.length > 0;
}

/**
 * check weather an organization with organizationid belongs to any group owned by the group admin
 * @param userAccount groupAdmin's account
 * @param organizationId the _id of the organization
 * @returns {Promise<boolean>}
 */
async function organizationBelongsToGroupAdmin(userAccount, organizationId) {
  // fetch all groups belong to the user
  const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
      return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
    }
  ));
  // check does there any group contain the organization with organizationId
  const checker = groups.filter(group => {
    return group.organizations.includes(`:organization_${organizationId}`);
  });
  if (checker.length > 0)
    return true;
  return false;
}


/**
 * the function is a middleware returns a bool indicating
 * if the user has access to the operation
 * @param req user's request
 * @param operationType a string describes the operation
 */
async function hasAccess(req, operationType) {
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  if (!userAccount)
    throw new Server400Error('Wrong auth');
  switch (operationType) {
    // organizations
    case 'createOrganization':
      return userAccount.isSuperuser;
    case 'updateOrganization':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.administratorOfs.length) {
        // firstly check the organization is below to the user
        const organizationId = req.params.id;
        const form = req.body.form;
        if (organizationBelongsToUser(userAccount, organizationId, 'administratorOfs')) {
          // then check has the user update the administrator
          const organization = await GDBOrganizationModel.findOne({_id: organizationId});
          if (organization.administrator.split('_')[1] === form.administrator)
            return true;
        }
      }
      break;
    case 'fetchOrganization':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.administratorOfs.length) {
        // check is the organization administrated to the user
        const organizationId = req.params.id;
        if (organizationBelongsToUser(userAccount, organizationId, 'administratorOfs'))
          return true;
      }
      break;
    case 'fetchOrganizations':
      if (userAccount.isSuperuser)
        return true;
      break;

    // users
    case 'fetchUsers':
      return true;

    // indicators
    case 'fetchIndicators':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs.length > 0) {
        // pass if the organization belongs to the group administrated by the groupAdmin
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await organizationBelongsToGroupAdmin(userAccount, organizationId))
          return true;
      }
      // fetch all groups belong to the user
      //   const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
      //       return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
      //     }
      //   ));
      //   // check does there any group contain the organization with organizationId
      //   const checker = groups.filter(group => {
      //     return group.organizations.includes(`:organization_${organizationId}`);
      //   });
      //   if (checker.length > 0)
      //     return true;
      // }
      if (userAccount.administratorOfs.length > 0) {
        // pass if the organization belongs to the userAccount
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (organizationBelongsToUser(userAccount, organizationId, 'administratorOfs'))
          return true
      }
      if (userAccount.researcherOfs.length > 0) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (userAccount.researcherOfs.includes(`:organization_${organizationId}`))
          return true;
      }
      break;
    case 'fetchIndicator':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs.length > 0) {
        // check does the indicator belong to an organization belongs to a group belongs to the user

        // fetch the indicator from the database
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
          }
        ));
        for (let group of groups) {
          // fetch all organizations belongs to the group
          group.organizations = await Promise.all(group.organizations.map(organizationURI => {
            return GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]});
          }));
          // check if there any organization contain the indicator
          for (let organization of group.organizations) {
            if (organization.hasIndicators.includes(`:indicator_${id}`))
              return true;
          }
        }
      }
      break;
    case 'createIndicator':
      if(userAccount.isSuperuser) // todo: temp
        return true
      if (userAccount.editorOfs.length > 0){
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.organizations || !form.name || !form.description)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        const checkerList = form.organizations.map(organizationId => {
          return organizationBelongsToUser(userAccount, organizationId, 'editorOfs')
        })
        // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        if(!checkerList.includes(false))
          return true;
      }


      break;
    case 'updateIndicator':
      if (userAccount.isSuperuser) // todo: temp
        return true
      return false;

    // domains
    case 'fetchDomain':
      return true;
    case 'createDomain':
    case 'updateDomain':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'fetchDomains':
      return true;
  }

  return false;

}

module.exports = {URI2Id, hasAccess};