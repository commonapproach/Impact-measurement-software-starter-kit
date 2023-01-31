const {GDBOrganizationModel} = require("../models/organization");

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
  return checkerList.length > 0
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
    case 'createOrganization':
      return session.isSuperuser;
    case 'updateOrganization':
      if (session.isSuperuser)
        return true;
      if (session.administratorOfs.length) {
        // firstly check the organization is below to the user
        const organizationId = req.params.id;
        const form = req.body.form;
        if (organizationBelongsToUser(session, organizationId)){
          // then check has the user update the administrator
          const organization = await GDBOrganizationModel.findOne({_id: organizationId});
          if (organization.administrator.split('_')[1] === form.administrator)
            return true;
        }
      }
      return false;
    case 'fetchOrganization':
      if (session.isSuperuser)
        return true;
      if (session.administratorOfs.length) {
        // check weather the organization belongs to the user
        const organizationId = req.params.id;
       if (organizationBelongsToUser(session, organizationId))
         return true;
      }
      return false;
    case 'fetchOrganizations':
      if(session.isSuperuser)
        return true
      return false;
    case 'fetchUsers':
      return true
  }

      return false;

  }

module.exports = {URI2Id, hasAccess};