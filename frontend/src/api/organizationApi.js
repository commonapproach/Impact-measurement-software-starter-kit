import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchOrganizations(userContext) {
  if(userContext.isSuperuser)
    return getJson('/api/superuser/organizations');
  if(userContext.groupAdminOf.length > 0)
    return getJson('/api/groupAdmin/organizations');
  if(userContext.administratorOf.length > 0)
    return getJson('/api/admin/organizations');
}

export async function fetchOrganization(orgId, userContext) {
  if(userContext.isSuperuser || userContext.groupAdminOf.length > 0)
    return getJson('/api/organization/' + orgId);
}

export async function createOrganization(params) {
  return postJson('/api/superuser/organization/', params);
}

export async function updateOrganization(id, params, userContext) {
  if(userContext.isSuperuser)
    return putJson('/api/superuser/organization/' + id, params);
  if(userContext.administratorOfs?.length > 0)
    return putJson('/api/admin/organization/' + id, params);
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id)
}