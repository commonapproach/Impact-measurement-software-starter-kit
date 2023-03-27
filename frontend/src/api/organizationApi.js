import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchOrganizations() {
  return getJson('/api/organizations');
}

export async function fetchOrganization(orgId, userContext) {
  return getJson('/api/organization/' + orgId);
}

export async function createOrganization(params) {
  return postJson('/api/organization/', params);
}

export async function updateOrganization(id, params) {
  return putJson('/api/organization/' + id, params);
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id);
}