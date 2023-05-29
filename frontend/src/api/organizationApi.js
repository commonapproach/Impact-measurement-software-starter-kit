import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchOrganizations() {
  return getJson('/api/organizations/');
}

export async function fetchOrganizationsBasedOnGroup(groupUri) {
  return getJson('/api/organizations/' + groupUri);
}

export async function fetchOrganization(orgUri,) {
  return getJson('/api/organization/' + orgUri);
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