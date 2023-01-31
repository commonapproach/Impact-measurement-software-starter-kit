import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchOrganizations(userContext) {
  if (userContext.isSuperuser || userContext.groupAdminOf?.length > 0 || userContext.administratorOf?.length > 0)
    return getJson('/api/organizations');
}

export async function fetchOrganization(orgId, userContext) {
  if (userContext.isSuperuser || userContext.groupAdminOf?.length > 0)
    return getJson('/api/organization/' + orgId);
}

export async function createOrganization(params) {
  return postJson('/api/organization/', params);
}

export async function updateOrganization(id, params, userContext) {
  if (userContext.isSuperuser || userContext.administratorOfs?.length > 0)
    return putJson('/api/organization/' + id, params);
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id);
}