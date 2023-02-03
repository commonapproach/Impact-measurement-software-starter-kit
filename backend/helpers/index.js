const {GDBOrganizationModel} = require("../models/organization");
const {Server400Error} = require("../utils");
const {GDBGroupModel} = require("../models/group");
const {GDBIndicatorModel} = require("../models/indicator");

function URI2Id(uri) {
  return uri.split('_')[1];
}

/**
 * the function checks weather the organization is administrated by the user
 * @param session user's session
 * @param organizationId organization's id
 */
function organizationBelongsToUser(session, organizationId) {
  const checkerList = session.administratorOfs.filter(organizationURL =>
    organizationURL.split('_')[1] === organizationId
  );
  return checkerList.length > 0;
}

/**
 * the function is a middleware returns a bool indicating
 * if the user has access to the operation
 * @param req user's request
 * @param operationType a string describes the operation
 */
async function hasAccess(req, operationType) {
  const session = req.session;
  switch (operationType) {
    // organizations
    case 'createOrganization':
      return session.isSuperuser;
    case 'updateOrganization':
      if (session.isSuperuser)
        return true;
      if (session.administratorOfs.length) {
        // firstly check the organization is below to the user
        const organizationId = req.params.id;
        const form = req.body.form;
        if (organizationBelongsToUser(session, organizationId)) {
          // then check has the user update the administrator
          const organization = await GDBOrganizationModel.findOne({_id: organizationId});
          if (organization.administrator.split('_')[1] === form.administrator)
            return true;
        }
      }
      break;
    case 'fetchOrganization':
      if (session.isSuperuser)
        return true;
      if (session.administratorOfs.length) {
        // check weather the organization belongs to the user
        const organizationId = req.params.id;
        if (organizationBelongsToUser(session, organizationId))
          return true;
      }
      break;
    case 'fetchOrganizations':
      if (session.isSuperuser)
        return true;
      break;

    // users
    case 'fetchUsers':
      return true;

    // indicators
    case 'fetchIndicators':
      if (session.isSuperuser)
        return true;
      if (session.groupAdminOfs.length > 0){
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed')

        // fetch all groups belong to the user
        const groups = await Promise.all(session.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
          }
        ))
        // check does there any group contain the organization with organizationId
        const checker = groups.filter(group => {
          return group.organizations.includes(`:organization_${organizationId}`)
        })
        if (checker.length > 0)
          return true
      }
      break;
    case 'fetchIndicator':
      if (session.isSuperuser)
        return true;
      if (session.groupAdminOfs.length > 0) {
        // check does the indicator belong to an organization belongs to a group belongs to the user

        // fetch the indicator from the database
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(session.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
          }
        ))
        for (let group of groups){
          // fetch all organizations belongs to the group
          group.organizations = await Promise.all(group.organizations.map(organizationURI => {
            return GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]})
          }))
          // check if there any organization contain the indicator
          for (let organization of group.organizations) {
            if (organization.hasIndicators.includes(`:indicator_${id}`))
              return true
          }
        }
      }
      break;
    case 'createIndicator':
    case 'updateIndicator':

      return false;

    // domains
    case 'fetchDomain':
      return true;
    case 'createDomain':
    case 'updateDomain':
      if (session.isSuperuser)
        return true;
      break;
    case 'fetchDomains':
      return true;
  }

  return false;

}

module.exports = {URI2Id, hasAccess};